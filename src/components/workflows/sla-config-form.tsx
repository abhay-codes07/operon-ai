"use client";

import { useState } from "react";

type SLAConfigFormProps = {
  workflowId: string;
  initial: {
    expectedSchedule: string;
    maxFailureRate: number;
    maxExecutionTimeSeconds: number;
    rollingWindowDays: number;
    notificationSlackChannel?: string;
    notificationEmail?: string;
    escalationAfterBreaches: number;
  };
};

export function SLAConfigForm({ workflowId, initial }: SLAConfigFormProps): JSX.Element {
  const [form, setForm] = useState(initial);
  const [state, setState] = useState<{ loading: boolean; error?: string; success?: string }>({
    loading: false,
  });

  async function save() {
    setState({ loading: true });
    const response = await fetch(`/api/workflows/${workflowId}/sla`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    if (!response.ok) {
      setState({
        loading: false,
        error: payload?.error?.message ?? "Failed to save SLA",
      });
      return;
    }
    setState({ loading: false, success: "SLA saved" });
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Expected Schedule (cron)</span>
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          value={form.expectedSchedule}
          onChange={(event) => setForm((current) => ({ ...current, expectedSchedule: event.target.value }))}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Max Failure Rate ({Math.round(form.maxFailureRate * 100)}%)</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(form.maxFailureRate * 100)}
          onChange={(event) =>
            setForm((current) => ({ ...current, maxFailureRate: Number(event.target.value) / 100 }))
          }
          className="w-full"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Max Execution Time (seconds)</span>
        <input
          type="number"
          min={1}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          value={form.maxExecutionTimeSeconds}
          onChange={(event) =>
            setForm((current) => ({ ...current, maxExecutionTimeSeconds: Number(event.target.value) }))
          }
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Rolling Window Days</span>
        <input
          type="number"
          min={1}
          max={90}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          value={form.rollingWindowDays}
          onChange={(event) =>
            setForm((current) => ({ ...current, rollingWindowDays: Number(event.target.value) }))
          }
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Notification Slack Channel</span>
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          value={form.notificationSlackChannel ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, notificationSlackChannel: event.target.value }))}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Notification Email</span>
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          value={form.notificationEmail ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, notificationEmail: event.target.value }))}
        />
      </label>

      <button
        type="button"
        onClick={save}
        disabled={state.loading}
        className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
      >
        {state.loading ? "Saving..." : "Save SLA Contract"}
      </button>

      {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
    </div>
  );
}
