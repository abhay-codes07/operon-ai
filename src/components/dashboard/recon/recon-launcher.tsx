"use client";

import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Globe,
  FileWarning,
  FolderOpen,
  Code2,
  Server,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Agent = {
  id: string;
  name: string;
};

type ReconLauncherProps = {
  agents: Agent[];
};

type CheckType =
  | "ADMIN_PANELS"
  | "SENSITIVE_FILES"
  | "LOGIN_LEAKAGE"
  | "DIRECTORY_LISTING"
  | "API_EXPOSURE"
  | "SSL_HEADERS";

type CheckStatus = "PENDING" | "RUNNING" | "DONE";
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLEAN";

type ReconResult = {
  reconId: string;
  checks: Array<{ executionId: string; checkType: CheckType }>;
};

const CHECK_META: Record<
  CheckType,
  {
    label: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  ADMIN_PANELS: {
    label: "Admin Panel Exposure",
    description: "Checks for accessible admin dashboards without authentication",
    Icon: Lock,
  },
  SENSITIVE_FILES: {
    label: "Sensitive File Exposure",
    description: "Probes for leaked .env, config files, and database backups",
    Icon: FileWarning,
  },
  LOGIN_LEAKAGE: {
    label: "Login Information Leakage",
    description: "Tests if login errors reveal valid email addresses",
    Icon: Globe,
  },
  DIRECTORY_LISTING: {
    label: "Directory Listing",
    description: "Detects open directory indexes exposing file structures",
    Icon: FolderOpen,
  },
  API_EXPOSURE: {
    label: "Unauthenticated API Access",
    description: "Scans API endpoints for unauthenticated data exposure",
    Icon: Code2,
  },
  SSL_HEADERS: {
    label: "Security Headers Audit",
    description: "Checks for missing HSTS, CSP, and X-Frame-Options headers",
    Icon: Server,
  },
};

const DEMO_SEVERITIES: Severity[] = [
  "CRITICAL",
  "HIGH",
  "HIGH",
  "MEDIUM",
  "MEDIUM",
  "CLEAN",
];

const SEVERITY_STYLES: Record<Severity, string> = {
  CRITICAL: "border-red-500/40 bg-red-500/10 text-red-400",
  HIGH: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  MEDIUM: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  LOW: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  CLEAN: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

const inputClass = cn(
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
  "px-3 py-2 text-sm placeholder-slate-500",
  "focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
);

const CHECK_ORDER: CheckType[] = [
  "ADMIN_PANELS",
  "SENSITIVE_FILES",
  "LOGIN_LEAKAGE",
  "DIRECTORY_LISTING",
  "API_EXPOSURE",
  "SSL_HEADERS",
];

export function ReconLauncher({ agents }: ReconLauncherProps) {
  const [domain, setDomain] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [reconResult, setReconResult] = useState<ReconResult | null>(null);
  const [findingStatuses, setFindingStatuses] = useState<
    Record<CheckType, CheckStatus>
  >({} as Record<CheckType, CheckStatus>);
  const [severities, setSeverities] = useState<Record<CheckType, Severity>>(
    {} as Record<CheckType, Severity>,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReconResult(null);

    if (!domain.trim()) {
      setError("Enter a domain to scan.");
      return;
    }
    if (!selectedAgentId) {
      setError("Select an agent.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/internal/recon/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), agentId: selectedAgentId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body?.error ?? `Request failed with status ${res.status}`);
      }

      const result = (await res.json()) as ReconResult;
      setReconResult(result);

      // Initialize all to PENDING
      const initial = {} as Record<CheckType, CheckStatus>;
      for (const ct of CHECK_ORDER) initial[ct] = "PENDING";
      setFindingStatuses(initial);

      // After 3s → RUNNING
      setTimeout(() => {
        const running = {} as Record<CheckType, CheckStatus>;
        for (const ct of CHECK_ORDER) running[ct] = "RUNNING";
        setFindingStatuses(running);
      }, 3000);

      // After 8s → DONE with severities
      setTimeout(() => {
        const done = {} as Record<CheckType, CheckStatus>;
        const sev = {} as Record<CheckType, Severity>;
        CHECK_ORDER.forEach((ct, i) => {
          done[ct] = "DONE";
          sev[ct] = DEMO_SEVERITIES[i] ?? "CLEAN";
        });
        setFindingStatuses(done);
        setSeverities(sev);
      }, 8000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }

  const allDone =
    reconResult !== null &&
    CHECK_ORDER.every((ct) => findingStatuses[ct] === "DONE");

  const summaryCounts = allDone
    ? CHECK_ORDER.reduce<Record<Severity, number>>(
        (acc, ct) => {
          const sev = severities[ct];
          if (sev) acc[sev] = (acc[sev] ?? 0) + 1;
          return acc;
        },
        { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, CLEAN: 0 },
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Launch form */}
      <form onSubmit={handleLaunch} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Target Domain
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={loading}
            placeholder="acme.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Agent
          </label>
          {agents.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No agents available. Provision an agent first.
            </p>
          ) : (
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              disabled={loading}
              className={cn(inputClass, "cursor-pointer")}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id} className="bg-slate-900">
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || agents.length === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
            "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
            "hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Launching Recon Swarm...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Launch Recon Swarm
            </>
          )}
        </button>
      </form>

      {/* Results grid */}
      {reconResult ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Recon Results Grid</h3>
            <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[10px] font-mono text-slate-400">
              {reconResult.reconId.slice(-8)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {CHECK_ORDER.map((checkType, idx) => {
              const meta = CHECK_META[checkType];
              const Icon = meta.Icon;
              const status = findingStatuses[checkType] ?? "PENDING";
              const severity = severities[checkType];
              const check = reconResult.checks.find(
                (c) => c.checkType === checkType,
              );

              return (
                <div
                  key={checkType}
                  className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 space-y-3 transition-all hover:border-slate-600/80 hover:bg-slate-800/60"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700/60">
                        <Icon className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <p className="text-xs font-semibold text-slate-200 leading-tight">
                        {meta.label}
                      </p>
                    </div>
                  </div>

                  {/* Status + Severity row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status badge */}
                    {status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/50 bg-slate-700/40 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                        Pending
                      </span>
                    )}
                    {status === "RUNNING" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Running
                      </span>
                    )}
                    {status === "DONE" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                      </span>
                    )}

                    {/* Severity badge (only when DONE) */}
                    {status === "DONE" && severity ? (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                          SEVERITY_STYLES[severity],
                        )}
                      >
                        {severity === "CRITICAL" && (
                          <XCircle className="mr-1 inline h-3 w-3" />
                        )}
                        {severity === "HIGH" && (
                          <AlertTriangle className="mr-1 inline h-3 w-3" />
                        )}
                        {severity}
                      </span>
                    ) : null}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {meta.description}
                  </p>

                  {/* Execution ID */}
                  {check ? (
                    <p className="text-[10px] font-mono text-slate-600 truncate">
                      exec: {check.executionId.slice(-12)}
                    </p>
                  ) : null}

                  {/* Loading shimmer when RUNNING */}
                  {status === "RUNNING" ? (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-3/4 animate-pulse rounded-full bg-slate-700/60" />
                      <div className="h-1.5 w-1/2 animate-pulse rounded-full bg-slate-700/40" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Summary bar */}
          {allDone && summaryCounts ? (
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-5 py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  {summaryCounts.CRITICAL > 0 && (
                    <span className="font-semibold text-red-400">
                      {summaryCounts.CRITICAL} Critical
                    </span>
                  )}
                  {summaryCounts.HIGH > 0 && (
                    <span className="font-semibold text-orange-400">
                      {summaryCounts.HIGH} High
                    </span>
                  )}
                  {summaryCounts.MEDIUM > 0 && (
                    <span className="font-semibold text-amber-400">
                      {summaryCounts.MEDIUM} Medium
                    </span>
                  )}
                  {summaryCounts.LOW > 0 && (
                    <span className="font-semibold text-yellow-400">
                      {summaryCounts.LOW} Low
                    </span>
                  )}
                  {summaryCounts.CLEAN > 0 && (
                    <span className="font-semibold text-emerald-400">
                      {summaryCounts.CLEAN} Clean
                    </span>
                  )}
                  <span className="text-slate-500">— Report ready</span>
                </div>

                {/* Download Report button */}
                <div className="relative group">
                  <button
                    disabled
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-400",
                      "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Download Report
                  </button>
                  <div className="absolute bottom-full mb-1.5 right-0 hidden group-hover:block z-10">
                    <div className="rounded-lg border border-slate-700/60 bg-slate-800 px-3 py-1.5 text-[11px] text-slate-300 whitespace-nowrap shadow-lg">
                      Generating PDF...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
