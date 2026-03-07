"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type ComplianceDashboardLiveProps = {
  initial: {
    totalWorkflows: number;
    approvedWorkflows: number;
    violations: number;
    passportsGenerated: number;
  };
};

export function ComplianceDashboardLive({ initial }: ComplianceDashboardLiveProps): JSX.Element {
  const [summary, setSummary] = useState(initial);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/compliance/dashboard", {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      summary: ComplianceDashboardLiveProps["initial"];
    };
    setSummary(payload.summary);
  }, []);

  usePolling(refresh, 10_000, true);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Workflows</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalWorkflows}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Approved</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.approvedWorkflows}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Violations</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.violations}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">Passports</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.passportsGenerated}</p>
      </article>
    </div>
  );
}
