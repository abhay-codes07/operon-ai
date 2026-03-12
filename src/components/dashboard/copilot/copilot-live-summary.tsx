"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type SummaryState = {
  sessionCount: number;
  interventionCount: number;
  averageAgentConfidence: number;
};

type CoPilotLiveSummaryProps = {
  initial: SummaryState;
};

export function CoPilotLiveSummary({ initial }: CoPilotLiveSummaryProps) {
  const [state, setState] = useState(initial);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/copilot/summary", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { summary: SummaryState };
    setState(payload.summary);
  }, []);

  usePolling(refresh, 10_000, true);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Sessions</p>
        <p className="text-lg font-semibold text-slate-900">{state.sessionCount}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Interventions</p>
        <p className="text-lg font-semibold text-slate-900">{state.interventionCount}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Avg Agent Confidence</p>
        <p className="text-lg font-semibold text-slate-900">{Math.round(state.averageAgentConfidence * 100)}%</p>
      </article>
    </div>
  );
}
