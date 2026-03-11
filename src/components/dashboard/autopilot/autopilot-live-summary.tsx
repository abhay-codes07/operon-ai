"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type AutopilotLiveSummaryProps = {
  initial: {
    totalSessions: number;
    activeSessions: number;
    reviewSessions: number;
    repairEvents: number;
    averageRepairConfidence: number;
  };
};

type SummaryApiPayload = {
  summary: {
    sessionsByStatus: Array<{ status: string; count: number }>;
    repairEventCount: number;
    repairConfidenceAvg: number;
  };
};

export function AutopilotLiveSummary({ initial }: AutopilotLiveSummaryProps) {
  const [state, setState] = useState(initial);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/autopilot/summary", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as SummaryApiPayload;
    const totalSessions = payload.summary.sessionsByStatus.reduce((sum, item) => sum + item.count, 0);
    const activeSessions = payload.summary.sessionsByStatus
      .filter((item) => item.status === "RECORDING")
      .reduce((sum, item) => sum + item.count, 0);
    const reviewSessions = payload.summary.sessionsByStatus
      .filter((item) => item.status === "REVIEW")
      .reduce((sum, item) => sum + item.count, 0);

    setState({
      totalSessions,
      activeSessions,
      reviewSessions,
      repairEvents: payload.summary.repairEventCount,
      averageRepairConfidence: payload.summary.repairConfidenceAvg,
    });
  }, []);

  usePolling(refresh, 10_000, true);

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Total Sessions</p>
        <p className="text-lg font-semibold text-slate-900">{state.totalSessions}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Recording</p>
        <p className="text-lg font-semibold text-slate-900">{state.activeSessions}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">In Review</p>
        <p className="text-lg font-semibold text-slate-900">{state.reviewSessions}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Repair Events</p>
        <p className="text-lg font-semibold text-slate-900">{state.repairEvents}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Avg Repair Confidence</p>
        <p className="text-lg font-semibold text-slate-900">{Math.round(state.averageRepairConfidence * 100)}%</p>
      </article>
    </div>
  );
}
