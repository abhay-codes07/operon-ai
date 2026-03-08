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
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Budget Control</h2>
      <div className="mt-3 space-y-2">
        <label className="block space-y-1">
          <span className="text-xs text-slate-600">Monthly Budget USD</span>
          <input
            type="number"
            min={1}
            step={0.01}
            value={monthlyBudgetUsd}
            onChange={(event) => setMonthlyBudgetUsd(Number(event.target.value))}
            className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-slate-600">Alert Threshold %</span>
          <input
            type="number"
            min={1}
            max={100}
            value={alertThresholdPercent}
            onChange={(event) => setAlertThresholdPercent(Number(event.target.value))}
            className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
          />
        </label>
        <Button type="button" onClick={save} disabled={state.loading}>
          {state.loading ? "Saving..." : "Save Budget"}
        </Button>
        {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
        {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
      </div>
    </section>
  );
}
