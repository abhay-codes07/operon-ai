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
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Pipelines</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalPipelines}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Active Runs</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.runningRuns}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Failed Runs</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.failedRuns}</p>
      </article>
    </section>
  );
}
