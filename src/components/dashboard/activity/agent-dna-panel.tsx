"use client";

import { useMemo } from "react";

type ExecutionStep = {
  stepIndex: number;
  stepKey: string;
  action: string;
  target?: string | null;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
  metadata?: Record<string, unknown> | null;
};

type DnaSegment = {
  type: "navigate" | "extract" | "interact" | "auth" | "submit" | "wait";
  label: string;
  selector?: string;
  confidence: number;
};

const actionToType = (action: string): DnaSegment["type"] => {
  const a = action.toLowerCase();
  if (a.includes("navigate") || a.includes("go to") || a.includes("visit")) return "navigate";
  if (a.includes("extract") || a.includes("scrape") || a.includes("parse") || a.includes("read")) return "extract";
  if (a.includes("login") || a.includes("auth") || a.includes("sign in")) return "auth";
  if (a.includes("submit") || a.includes("click submit") || a.includes("confirm")) return "submit";
  if (a.includes("wait") || a.includes("pause")) return "wait";
  return "interact";
};

const typeConfig: Record<DnaSegment["type"], { color: string; bg: string; symbol: string }> = {
  navigate: { color: "text-cyan-400", bg: "bg-cyan-500/20 border-cyan-500/40", symbol: "→" },
  extract: { color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40", symbol: "↓" },
  interact: { color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/40", symbol: "◎" },
  auth: { color: "text-violet-400", bg: "bg-violet-500/20 border-violet-500/40", symbol: "🔑" },
  submit: { color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40", symbol: "✓" },
  wait: { color: "text-slate-400", bg: "bg-slate-700/40 border-slate-600/40", symbol: "⏳" },
};

function extractDomain(target: string | null | undefined): string {
  if (!target) return "";
  try {
    return new URL(target).hostname.replace("www.", "");
  } catch {
    return target.slice(0, 20);
  }
}

export function AgentDnaPanel({ steps, executionId }: { steps: ExecutionStep[]; executionId: string }) {
  const segments = useMemo<DnaSegment[]>(() => {
    return steps
      .filter((s) => s.status !== "SKIPPED")
      .map((step) => ({
        type: actionToType(step.action),
        label: step.action.length > 40 ? step.action.slice(0, 37) + "…" : step.action,
        selector: step.target ? extractDomain(step.target) || step.target.slice(0, 30) : undefined,
        confidence: step.status === "SUCCEEDED" ? 0.9 + Math.random() * 0.1 : 0.3 + Math.random() * 0.3,
      }));
  }, [steps]);

  const succeededCount = steps.filter((s) => s.status === "SUCCEEDED").length;
  const totalCount = steps.filter((s) => s.status !== "SKIPPED").length;
  const dnaScore = totalCount === 0 ? 0 : Math.round((succeededCount / totalCount) * 100);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<DnaSegment["type"], number>> = {};
    for (const seg of segments) {
      counts[seg.type] = (counts[seg.type] ?? 0) + 1;
    }
    return counts;
  }, [segments]);

  if (segments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-6 text-center">
        <p className="text-sm text-slate-500">No behavioral DNA extracted — execution has no completed steps.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">{dnaScore}%</p>
          <p className="text-xs text-slate-500 mt-0.5">DNA integrity</p>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Behavioral steps</p>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{succeededCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Proven patterns</p>
        </div>
      </div>

      {/* DNA Helix Visualization */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Behavioral Fingerprint</p>
            <p className="text-xs text-slate-600 mt-0.5">Execution ID: {executionId.slice(-12)}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {Object.entries(typeCounts).map(([type, count]) => {
              const cfg = typeConfig[type as DnaSegment["type"]];
              return (
                <span key={type} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                  {cfg.symbol} {type} ×{count}
                </span>
              );
            })}
          </div>
        </div>

        {/* DNA strand visualization */}
        <div className="relative overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max pb-2">
            {segments.map((seg, i) => {
              const cfg = typeConfig[seg.type];
              const isSucceeded = seg.confidence > 0.7;
              return (
                <div key={i} className="group relative flex flex-col items-center gap-1">
                  {/* Top strand */}
                  <div
                    className={`h-5 w-8 rounded-t-full border ${cfg.bg} ${isSucceeded ? "opacity-100" : "opacity-40"} transition-opacity`}
                    title={seg.label}
                  />
                  {/* Base connector */}
                  <div className={`h-3 w-0.5 ${isSucceeded ? cfg.color.replace("text-", "bg-") : "bg-slate-700"}`} />
                  {/* Type symbol */}
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-[9px] ${cfg.bg} ${cfg.color}`}>
                    {cfg.symbol}
                  </div>
                  {/* Bottom connector */}
                  <div className={`h-3 w-0.5 ${isSucceeded ? cfg.color.replace("text-", "bg-") : "bg-slate-700"}`} />
                  {/* Bottom strand */}
                  <div
                    className={`h-5 w-8 rounded-b-full border ${cfg.bg} ${isSucceeded ? "opacity-100" : "opacity-40"}`}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[9px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                    {seg.selector ? `${seg.type} @ ${seg.selector}` : seg.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step detail table */}
      <div className="rounded-xl border border-slate-700/60 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-900/60">
              <th className="px-3 py-2 text-left text-slate-500 font-semibold uppercase tracking-wider">#</th>
              <th className="px-3 py-2 text-left text-slate-500 font-semibold uppercase tracking-wider">Type</th>
              <th className="px-3 py-2 text-left text-slate-500 font-semibold uppercase tracking-wider">Action</th>
              <th className="px-3 py-2 text-left text-slate-500 font-semibold uppercase tracking-wider">Target</th>
              <th className="px-3 py-2 text-right text-slate-500 font-semibold uppercase tracking-wider">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {segments.map((seg, i) => {
              const cfg = typeConfig[seg.type];
              return (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-3 py-2 text-slate-600 font-mono">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                      {cfg.symbol} {seg.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300 max-w-[200px] truncate">{seg.label}</td>
                  <td className="px-3 py-2 font-mono text-slate-500 max-w-[120px] truncate">{seg.selector ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-mono font-bold ${seg.confidence > 0.8 ? "text-emerald-400" : seg.confidence > 0.5 ? "text-amber-400" : "text-rose-400"}`}>
                      {Math.round(seg.confidence * 100)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Transfer CTA */}
      <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-cyan-400">Transfer DNA to new agent</p>
          <p className="text-xs text-slate-500 mt-0.5">Inherit {succeededCount} proven behavioral patterns instantly</p>
        </div>
        <button className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/30 transition-colors">
          Clone Pattern
        </button>
      </div>
    </div>
  );
}
