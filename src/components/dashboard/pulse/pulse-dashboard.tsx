"use client";

import { useState } from "react";
import {
  Zap,
  Loader2,
  DollarSign,
  Briefcase,
  Cpu,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Agent = {
  id: string;
  name: string;
};

type PulseDashboardProps = {
  agents: Agent[];
};

type ScanType = "PRICING" | "JOBS" | "FEATURES";
type ScanStatus = "RUNNING" | "DONE";

type ScanCard = {
  scanType: ScanType;
  status: ScanStatus;
  executionId: string;
  summary: string;
};

type PulseResponse = {
  pulseId: string;
  scans: Array<{ executionId: string; scanType: ScanType }>;
};

const SCAN_META: Record<
  ScanType,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  PRICING: {
    label: "Pricing Intelligence",
    Icon: DollarSign,
    color: "text-emerald-400",
  },
  JOBS: {
    label: "Hiring Signal Analysis",
    Icon: Briefcase,
    color: "text-blue-400",
  },
  FEATURES: {
    label: "Feature Tracker",
    Icon: Cpu,
    color: "text-violet-400",
  },
};

const MOCK_SUMMARIES: Record<ScanType, string> = {
  PRICING:
    "3 tiers detected: Starter $29/mo · Pro $99/mo · Enterprise custom. NOTE: Added a new 'Team' tier at $49/mo in last 30 days",
  JOBS:
    "14 open roles. High: Engineering (8 roles) + ML (3 roles) → likely new AI feature in 90 days",
  FEATURES:
    "Added 'AI Assistant' (BETA) and 'Bulk Export' (NEW) since last scan",
};

const inputClass = cn(
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
  "px-3 py-2 text-sm placeholder-slate-500",
  "focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
);

export function PulseDashboard({ agents }: PulseDashboardProps) {
  const [competitor, setCompetitor] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<ScanCard[]>([]);
  const [battleCard, setBattleCard] = useState<string | null>(null);
  const [generatingBattleCard, setGeneratingBattleCard] = useState(false);
  const [scannedDomain, setScannedDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setScans([]);
    setBattleCard(null);
    setGeneratingBattleCard(false);

    if (!competitor.trim()) {
      setError("Enter a competitor domain.");
      return;
    }
    if (!selectedAgentId) {
      setError("Select an agent.");
      return;
    }

    setLoading(true);
    setScannedDomain(competitor.trim());

    try {
      const res = await fetch("/api/internal/pulse/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: competitor.trim(),
          agentId: selectedAgentId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body?.error ?? `Request failed with status ${res.status}`);
      }

      const result = (await res.json()) as PulseResponse;

      // Initialize scans as RUNNING
      const initialScans: ScanCard[] = result.scans.map((s) => ({
        scanType: s.scanType,
        status: "RUNNING" as ScanStatus,
        executionId: s.executionId,
        summary: "",
      }));
      setScans(initialScans);

      // After 8s → DONE with mock summaries
      setTimeout(() => {
        setScans(
          result.scans.map((s) => ({
            scanType: s.scanType,
            status: "DONE" as ScanStatus,
            executionId: s.executionId,
            summary: MOCK_SUMMARIES[s.scanType],
          })),
        );
        setGeneratingBattleCard(true);

        // After 3 more seconds, show battle card
        setTimeout(() => {
          setGeneratingBattleCard(false);
          setBattleCard("ready");
        }, 3000);
      }, 8000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — Add competitor */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Add Competitor</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Deploys 3 agents: Pricing · Jobs · Features
              </p>
            </div>

            <form onSubmit={handleScan} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Competitor Domain
                </label>
                <input
                  type="text"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                  disabled={loading}
                  placeholder="competitor.com"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Agent
                </label>
                {agents.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    No agents available.
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
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || agents.length === 0}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                  "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
                  "hover:from-cyan-400 hover:to-blue-500",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Scan Competitor
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right column — Intelligence Feed */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Intelligence Feed</h3>

            {scans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700/60 p-8 text-center">
                <p className="text-sm font-medium text-slate-400">
                  No scans running
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Add a competitor domain to start gathering intelligence.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scans.map((scan) => {
                  const meta = SCAN_META[scan.scanType];
                  const Icon = meta.Icon;

                  return (
                    <div
                      key={scan.scanType}
                      className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800/80">
                          <Icon className={cn("h-4 w-4", meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-200">
                              {meta.label}
                            </p>
                            {scan.status === "RUNNING" ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                Running
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-400">
                                Done
                              </span>
                            )}
                          </div>

                          {scan.status === "RUNNING" ? (
                            <div className="mt-2 space-y-1.5">
                              <div className="h-1.5 w-3/4 animate-pulse rounded-full bg-slate-700/60" />
                              <div className="h-1.5 w-1/2 animate-pulse rounded-full bg-slate-700/40" />
                            </div>
                          ) : (
                            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                              {scan.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Battle Card */}
      {generatingBattleCard ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            <p className="text-sm font-semibold text-slate-300">
              Generating Battle Card...
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-700/60" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-700/40" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-700/30" />
          </div>
        </div>
      ) : null}

      {battleCard === "ready" ? (
        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-500/70">
                AI Generated
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-white">
                Battle Card:{" "}
                <span className="text-cyan-400">{scannedDomain}</span>
              </h3>
            </div>
            <Zap className="h-6 w-6 text-cyan-500/60" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Their Strengths */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Their Strengths
              </p>
              <ul className="space-y-1.5">
                {[
                  "Aggressive pricing — new Team tier at $49/mo undercuts mid-market",
                  "Heavy ML hiring signals a new AI-native product in Q3",
                  "Bulk Export feature fills a common pain point in their user base",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs text-amber-200/80"
                  >
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Your Advantages */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Your Advantages
              </p>
              <ul className="space-y-1.5">
                {[
                  "Deeper agent orchestration — swarm + recon tooling unavailable in their platform",
                  "Real-time execution visibility with live SSE streaming",
                  "Native workflow builder with schedule automation already shipped",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs text-cyan-200/80"
                  >
                    <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-cyan-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended response */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Recommended Response
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Accelerate the DataMesh launch and position it as the developer
              extraction API they lack. Their ML hiring indicates a 90-day window
              before they ship an AI assistant — ship yours first and lock in
              enterprise deals with white-glove onboarding.
            </p>
          </div>

          {/* Weakness to exploit */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
              Weakness to Exploit
            </p>
            <p className="text-sm text-red-300/80 leading-relaxed">
              No public API surface — their platform is entirely GUI-driven, making
              developer adoption an open gap that Operon can own with DataMesh.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
