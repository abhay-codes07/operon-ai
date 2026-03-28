"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type PipelineStats = {
  totalPipelines: number;
  totalRuns: number;
  runningRuns: number;
  pausedRuns: number;
  failedRuns: number;
  completedRuns: number;
};

type PipelineStatsPanelProps = {
  initialStats: PipelineStats;
};

export function PipelineStatsPanel({ initialStats }: PipelineStatsPanelProps): JSX.Element {
  const [stats, setStats] = useState(initialStats);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/pipelines/stats", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { stats: PipelineStats };
    setStats(payload.stats);
  }, []);

  usePolling(refresh, 10_000, true);

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
        <p className="text-xs text-slate-400">Pipelines</p>
        <p className="mt-1 text-2xl font-semibold text-white">{stats.totalPipelines}</p>
      </article>
      <article className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
        <p className="text-xs text-slate-400">Active Runs</p>
        <p className="mt-1 text-2xl font-semibold text-white">{stats.runningRuns}</p>
      </article>
      <article className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
        <p className="text-xs text-slate-400">Failed Runs</p>
        <p className="mt-1 text-2xl font-semibold text-white">{stats.failedRuns}</p>
      </article>
    </section>
  );
}
