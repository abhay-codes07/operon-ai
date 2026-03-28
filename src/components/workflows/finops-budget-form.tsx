"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type FinOpsBudgetFormProps = {
  workflowId: string;
  initialMonthlyBudgetUsd?: number;
  initialAlertThresholdPercent?: number;
};

export function FinOpsBudgetForm({
  workflowId,
  initialMonthlyBudgetUsd = 100,
  initialAlertThresholdPercent = 80,
}: FinOpsBudgetFormProps): JSX.Element {
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(initialMonthlyBudgetUsd);
  const [alertThresholdPercent, setAlertThresholdPercent] = useState(initialAlertThresholdPercent);
  const [state, setState] = useState<{ loading: boolean; error?: string; success?: string }>({ loading: false });

  async function save() {
    setState({ loading: true });
    const response = await fetch("/api/finops/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId,
        monthlyBudgetUsd,
        alertThresholdPercent,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to save budget" });
      return;
    }

    setState({ loading: false, success: "Budget updated." });
  }

  return (
    <section className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white">Budget Control</h2>
      <div className="mt-3 space-y-2">
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">Monthly Budget USD</span>
          <input
            type="number"
            min={1}
            step={0.01}
            value={monthlyBudgetUsd}
            onChange={(event) => setMonthlyBudgetUsd(Number(event.target.value))}
            className="h-9 w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-2 text-sm text-white focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">Alert Threshold %</span>
          <input
            type="number"
            min={1}
            max={100}
            value={alertThresholdPercent}
            onChange={(event) => setAlertThresholdPercent(Number(event.target.value))}
            className="h-9 w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-2 text-sm text-white focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
        <Button type="button" onClick={save} disabled={state.loading}>
          {state.loading ? "Saving..." : "Save Budget"}
        </Button>
        {state.error ? <p className="text-xs text-rose-400">{state.error}</p> : null}
        {state.success ? <p className="text-xs text-emerald-400">{state.success}</p> : null}
      </div>
    </section>
  );
}
