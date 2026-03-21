"use client";

import { cn } from "@/lib/utils/cn";

type SwarmExecution = {
  id: string;
  status: string;
  targetUrl?: string;
};

type SwarmSession = {
  swarmId: string;
  createdAt: Date | string;
  executions: SwarmExecution[];
};

type SwarmHistoryGridProps = {
  swarms: SwarmSession[];
};

function statusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "SUCCEEDED":
      return "text-emerald-400";
    case "RUNNING":
      return "text-blue-400";
    case "QUEUED":
      return "text-amber-400";
    case "FAILED":
      return "text-rose-400";
    case "CANCELED":
      return "text-slate-500";
    default:
      return "text-slate-400";
  }
}

function countByStatus(executions: SwarmExecution[]) {
  const counts: Record<string, number> = {};
  for (const exec of executions) {
    const s = exec.status.toUpperCase();
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}

function overallStatus(counts: Record<string, number>): string {
  if (counts["RUNNING"] || counts["QUEUED"]) return "RUNNING";
  if (counts["FAILED"] && !counts["SUCCEEDED"]) return "FAILED";
  if (counts["SUCCEEDED"] && !counts["FAILED"]) return "SUCCEEDED";
  if (counts["SUCCEEDED"] && counts["FAILED"]) return "PARTIAL";
  return "UNKNOWN";
}

const overallStatusStyles: Record<string, string> = {
  RUNNING: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  FAILED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  SUCCEEDED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  PARTIAL: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  UNKNOWN: "border-slate-700/50 bg-slate-800/40 text-slate-400",
};

export function SwarmHistoryGrid({ swarms }: SwarmHistoryGridProps) {
  if (swarms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700/60 p-10 text-center">
        <p className="text-sm font-medium text-slate-400">No swarm sessions yet</p>
        <p className="mt-1 text-xs text-slate-600">
          Launch your first swarm to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {swarms.map((swarm) => {
        const counts = countByStatus(swarm.executions);
        const overall = overallStatus(counts);
        const statusStyle = overallStatusStyles[overall] ?? overallStatusStyles["UNKNOWN"];
        const uniqueUrls = Array.from(
          new Set(swarm.executions.map((e) => e.targetUrl).filter(Boolean) as string[]),
        );

        return (
          <article
            key={swarm.swarmId}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 space-y-3 hover:border-slate-600/80 hover:bg-slate-800/60 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Swarm
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-slate-200">
                  …{swarm.swarmId.slice(-8)}
                </p>
              </div>
              <span
                className={cn(
                  "flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                  statusStyle,
                )}
              >
                {overall}
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-1.5 text-center">
                <p className="text-[10px] text-slate-500">Total</p>
                <p className="text-sm font-bold text-white tabular-nums">
                  {swarm.executions.length}
                </p>
              </div>
              {Object.entries(counts).map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-1.5 text-center"
                >
                  <p className="text-[10px] text-slate-500 capitalize">{status.toLowerCase()}</p>
                  <p className={cn("text-sm font-bold tabular-nums", statusColor(status))}>
                    {count}
                  </p>
                </div>
              ))}
            </div>

            {/* Target URL badges */}
            {uniqueUrls.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {uniqueUrls.slice(0, 5).map((url) => {
                  let displayUrl = url;
                  try {
                    displayUrl = new URL(url).hostname;
                  } catch {
                    // keep as-is
                  }
                  return (
                    <span
                      key={url}
                      title={url}
                      className="rounded-md border border-slate-700/50 bg-slate-900/50 px-2 py-0.5 text-[11px] text-slate-400 font-mono truncate max-w-[160px]"
                    >
                      {displayUrl}
                    </span>
                  );
                })}
                {uniqueUrls.length > 5 ? (
                  <span className="rounded-md border border-slate-700/50 bg-slate-900/50 px-2 py-0.5 text-[11px] text-slate-500">
                    +{uniqueUrls.length - 5} more
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Timestamp */}
            <p className="text-[11px] text-slate-600">
              {new Date(swarm.createdAt).toLocaleString()}
            </p>
          </article>
        );
      })}
    </div>
  );
}
