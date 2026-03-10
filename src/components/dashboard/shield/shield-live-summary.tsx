"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type ShieldSummary = {
  totalEvents: number;
  severity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  hotWorkflows: Array<{
    workflowId: string;
    workflowName: string;
    count: number;
  }>;
};

type ShieldLiveSummaryProps = {
  initial: ShieldSummary;
};

export function ShieldLiveSummary({ initial }: ShieldLiveSummaryProps): JSX.Element {
  const [summary, setSummary] = useState(initial);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/shield/summary", {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { summary: ShieldSummary };
    setSummary(payload.summary);
  }, []);

  usePolling(refresh, 15_000, true);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Total Events" value={summary.totalEvents} />
        <Metric label="Critical" value={summary.severity.CRITICAL} />
        <Metric label="High" value={summary.severity.HIGH} />
        <Metric label="Medium" value={summary.severity.MEDIUM} />
        <Metric label="Low" value={summary.severity.LOW} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hot Workflows</p>
        {summary.hotWorkflows.length === 0 ? (
          <p className="text-sm text-slate-600">No elevated threat concentration detected.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {summary.hotWorkflows.map((item) => (
              <article key={item.workflowId} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{item.workflowName}</p>
                <p className="text-xs text-slate-600">{item.count} events</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
