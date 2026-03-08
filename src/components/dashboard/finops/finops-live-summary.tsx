"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type FinOpsLiveSummaryProps = {
  initial: {
    totalSpendUsd: number;
    anomalyCount: number;
    workflowCount: number;
  };
};

export function FinOpsLiveSummary({ initial }: FinOpsLiveSummaryProps): JSX.Element {
  const [summary, setSummary] = useState(initial);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/finops/summary", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as {
      summary: {
        totalSpendUsd: number;
        anomalyCount: number;
        workflowCostRanking: Array<{ workflowId: string }>;
      };
    };
    setSummary({
      totalSpendUsd: payload.summary.totalSpendUsd,
      anomalyCount: payload.summary.anomalyCount,
      workflowCount: payload.summary.workflowCostRanking.length,
    });
  }, []);

  usePolling(refresh, 10_000, true);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Total AI Spend (Month)</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">${summary.totalSpendUsd.toFixed(2)}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Workflows Tracked</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.workflowCount}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Cost Anomalies</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.anomalyCount}</p>
      </article>
    </div>
  );
}
