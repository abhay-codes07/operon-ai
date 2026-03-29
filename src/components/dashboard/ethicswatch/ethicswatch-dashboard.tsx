"use client";

import { useEffect, useState } from "react";
import { Scale, X, ExternalLink, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Agent = {
  id: string;
  name: string;
};

type WatchCategory =
  | "ESG"
  | "GOVERNANCE"
  | "ENVIRONMENT"
  | "SOCIAL"
  | "REGULATIONS"
  | "SUPPLY_CHAIN";

type LastChange = {
  detectedAt: string;
  title: string;
  summary: string;
  implication: string;
  source: string;
  changeType: string;
};

type Monitor = {
  id: string;
  organizationName: string;
  organizationUrl: string;
  categories: WatchCategory[];
  status: "MONITORING" | "CHANGE_DETECTED" | "CRITICAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  lastChange: LastChange | null;
  monitoringSince: string;
  changesDetected: number;
  lastScanned: string;
};

type FormData = {
  organizationName: string;
  organizationUrl: string;
  watchCategories: WatchCategory[];
  agentId: string;
};

const ALL_CATEGORIES: WatchCategory[] = [
  "ESG",
  "GOVERNANCE",
  "ENVIRONMENT",
  "SOCIAL",
  "REGULATIONS",
  "SUPPLY_CHAIN",
];

const CATEGORY_LABELS: Record<WatchCategory, string> = {
  ESG: "ESG",
  GOVERNANCE: "Governance",
  ENVIRONMENT: "Environment",
  SOCIAL: "Social",
  REGULATIONS: "Regulations",
  SUPPLY_CHAIN: "Supply Chain",
};

const INITIAL_MONITORS: Monitor[] = [];

const inputClass = cn(
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
  "px-3 py-2 text-sm placeholder-slate-500",
  "focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30",
  "transition-colors",
);

function OrgInitial({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <div
      className={cn(
        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
        "bg-gradient-to-br text-white text-lg font-bold shadow-lg",
        colors[colorIndex],
      )}
    >
      {initial}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, string> = {
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/40",
    HIGH: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    LOW: "bg-slate-700/60 text-slate-400 border-slate-600/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        cfg[severity] ?? cfg.LOW,
      )}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: Monitor["status"] }) {
  if (status === "MONITORING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        MONITORING
      </span>
    );
  }
  if (status === "CRITICAL") {
    return (
      <span className="relative inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
        </span>
        CRITICAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      CHANGE DETECTED
    </span>
  );
}

function ChangeTypePill({ type }: { type: string }) {
  const labels: Record<string, string> = {
    NEW_REGULATION: "New Regulation",
    POLICY_EXPANSION: "Policy Expansion",
    POLICY_REDUCTION: "Policy Reduction",
    GOVERNANCE_CHANGE: "Governance Change",
    DISCLOSURE_UPDATE: "Disclosure Update",
    COMMITMENT_ADDED: "Commitment Added",
  };
  return (
    <span className="inline-flex items-center rounded-md border border-slate-600/40 bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-slate-400">
      {labels[type] ?? type}
    </span>
  );
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  const isCritical = monitor.status === "CRITICAL";
  const isChange = monitor.status === "CHANGE_DETECTED" || isCritical;

  const borderLeftColor =
    monitor.severity === "CRITICAL"
      ? "border-l-red-500"
      : monitor.severity === "HIGH"
        ? "border-l-amber-500"
        : "border-l-yellow-500";

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-all duration-300",
        isCritical
          ? "border-red-800/40 bg-gradient-to-b from-red-950/20 to-slate-900 shadow-xl shadow-red-900/40"
          : isChange
            ? "border-amber-700/40 bg-gradient-to-b from-amber-950/10 to-slate-900 shadow-lg shadow-amber-900/20"
            : "border-slate-700/60 bg-slate-900",
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-4 mb-4">
        <OrgInitial name={monitor.organizationName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white leading-tight">
                {monitor.organizationName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                {monitor.organizationUrl}
              </p>
            </div>
            <StatusBadge status={monitor.status} />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {monitor.categories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-300"
          >
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {/* Change alert section */}
      {isChange && monitor.lastChange && (
        <div
          className={cn(
            "rounded-xl border-l-4 border border-slate-700/40 bg-slate-800/60 p-4 mb-5",
            borderLeftColor,
          )}
        >
          {/* Severity + type row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {monitor.severity && <SeverityBadge severity={monitor.severity} />}
            <ChangeTypePill type={monitor.lastChange.changeType} />
            <span className="ml-auto text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {monitor.lastChange.detectedAt}
            </span>
          </div>

          {/* Title */}
          <p className="text-sm font-bold text-white leading-snug mb-2">
            {monitor.lastChange.title}
          </p>

          {/* Summary */}
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {monitor.lastChange.summary}
          </p>

          {/* Implication */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 block mb-1">
              Implication
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {monitor.lastChange.implication}
            </p>
          </div>

          {/* Source */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Source:</span>
            <a
              href={`https://${monitor.lastChange.source}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono truncate max-w-[240px]"
            >
              {monitor.lastChange.source}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      )}

      {/* No change yet */}
      {!isChange && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 px-4 py-3 mb-5 flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            No material changes detected since monitoring began.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-700/40 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-slate-600" />
          <span className="text-[11px] text-slate-500">
            Monitoring since {monitor.monitoringSince} ·{" "}
            <span className="text-slate-400 font-semibold">
              {monitor.changesDetected}
            </span>{" "}
            {monitor.changesDetected === 1 ? "change" : "changes"} detected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            View History
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}

export function EthicswatchDashboard({ agents }: { agents: Agent[] }) {
  const [monitors, setMonitors] = useState<Monitor[]>(INITIAL_MONITORS);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/internal/ethicswatch")
      .then((r) => r.json())
      .then((data: { monitors?: Monitor[] }) => {
        if (Array.isArray(data.monitors) && data.monitors.length > 0) {
          setMonitors(data.monitors);
        }
      })
      .catch(() => null);
  }, []);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    organizationName: "",
    organizationUrl: "",
    watchCategories: ["ESG"],
    agentId: agents[0]?.id ?? "",
  });

  const changesDetected = monitors.filter(
    (m) => m.status === "CHANGE_DETECTED" || m.status === "CRITICAL",
  ).length;
  const criticalCount = monitors.filter((m) => m.status === "CRITICAL").length;

  function toggleCategory(cat: WatchCategory) {
    setFormData((prev) => {
      const already = prev.watchCategories.includes(cat);
      if (already && prev.watchCategories.length === 1) return prev; // keep at least one
      return {
        ...prev,
        watchCategories: already
          ? prev.watchCategories.filter((c) => c !== cat)
          : [...prev.watchCategories, cat],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.agentId) {
      setFormError("Select an agent.");
      return;
    }

    if (formData.watchCategories.length === 0) {
      setFormError("Select at least one watch category.");
      return;
    }

    setLoading(true);
    try {
      const normalizedUrl = formData.organizationUrl.match(/^https?:\/\//)
        ? formData.organizationUrl
        : `https://${formData.organizationUrl}`;
      const res = await fetch("/api/internal/ethicswatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          organizationUrl: normalizedUrl,
          watchCategories: formData.watchCategories,
          agentId: formData.agentId,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      const newMonitor: Monitor = {
        id: `ew-${Date.now()}`,
        organizationName: formData.organizationName,
        organizationUrl: normalizedUrl,
        categories: formData.watchCategories,
        status: "MONITORING",
        severity: null,
        lastChange: null,
        monitoringSince: "just now",
        changesDetected: 0,
        lastScanned: "just now",
      };

      setMonitors((prev) => [newMonitor, ...prev]);
      // Trigger the worker from browser to process this execution
      fetch("/api/worker/run").catch(() => null);
      setShowForm(false);
      setFormData({
        organizationName: "",
        organizationUrl: "",
        watchCategories: ["ESG"],
        agentId: agents[0]?.id ?? "",
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">
            ESG & Ethics Intelligence
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">EthicsWatch</h1>
          <p className="mt-1 text-base text-slate-400 max-w-2xl">
            Real-time ESG & ethics intelligence. Know when organizations change their commitments,
            before anyone else does.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all flex-shrink-0",
            "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20",
            "hover:from-violet-400 hover:to-purple-500 hover:shadow-violet-500/30",
            "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
          )}
        >
          <Scale className="h-4 w-4" />
          Monitor an Organization
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <p className="text-2xl font-bold text-violet-400">{monitors.length}</p>
          <p className="mt-0.5 text-xs text-slate-500">Organizations Monitored</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <p className="text-2xl font-bold text-amber-400">{changesDetected}</p>
          <p className="mt-0.5 text-xs text-slate-500">Changes Detected</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
            {criticalCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Critical Alerts</p>
        </div>
      </div>

      {/* Add Monitor form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Monitor an Organization</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                TinyFish agents will continuously scan for ESG and ethics changes.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Organization Name
                </label>
                <input
                  required
                  className={inputClass}
                  placeholder="e.g. Apple Inc."
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, organizationName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Organization URL
                </label>
                <input
                  required
                  className={inputClass}
                  placeholder="https://company.com/sustainability"
                  value={formData.organizationUrl}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, organizationUrl: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Watch Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const selected = formData.watchCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                        selected
                          ? "border-violet-500/60 bg-violet-500/20 text-violet-300"
                          : "border-slate-700/60 bg-slate-800/60 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                      )}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
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
                  value={formData.agentId}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, agentId: e.target.value }))
                  }
                  disabled={loading}
                  className={cn(
                    inputClass,
                    "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900">
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {formError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || agents.length === 0}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all",
                "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20",
                "hover:from-violet-400 hover:to-purple-500 hover:shadow-violet-500/30",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
              )}
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Activating...
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  Activate Monitor
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Monitor cards */}
      <div className="space-y-4">
        {monitors.map((monitor) => (
          <MonitorCard key={monitor.id} monitor={monitor} />
        ))}
      </div>

      {monitors.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No organizations being monitored</p>
          <p className="text-slate-600 text-sm mt-1">
            Click &quot;Monitor an Organization&quot; to begin ESG intelligence tracking.
          </p>
        </div>
      )}
    </div>
  );
}
