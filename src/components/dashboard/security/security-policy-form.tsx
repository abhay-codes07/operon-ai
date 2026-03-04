"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SecurityPolicy = {
  domainAllowlist: string[];
  restrictedActions: string[];
  allowedWindowStartHr?: number;
  allowedWindowEndHr?: number;
  timezone: string;
  requireHttps: boolean;
};

type SecurityPolicyFormProps = {
  initialPolicy: SecurityPolicy;
};

export function SecurityPolicyForm({ initialPolicy }: SecurityPolicyFormProps): JSX.Element {
  const [policy, setPolicy] = useState(initialPolicy);
  const [state, setState] = useState<{ saving: boolean; error?: string; success?: string }>({
    saving: false,
  });

  async function savePolicy() {
    setState({ saving: true });
    const response = await fetch("/api/internal/security/policy", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policy),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setState({ saving: false, error: payload?.error ?? "Policy update failed" });
      return;
    }

    setState({ saving: false, success: "Policy saved" });
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Domain Allowlist</span>
        <textarea
          value={policy.domainAllowlist.join("\n")}
          onChange={(event) =>
            setPolicy((previous) => ({
              ...previous,
              domainAllowlist: event.target.value
                .split("\n")
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean),
            }))
          }
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="example.com&#10;app.example.com"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Restricted Actions
        </span>
        <input
          value={policy.restrictedActions.join(", ")}
          onChange={(event) =>
            setPolicy((previous) => ({
              ...previous,
              restrictedActions: event.target.value
                .split(",")
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean),
            }))
          }
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          placeholder="delete, submit, purchase"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Window Start (UTC)</span>
          <input
            type="number"
            min={0}
            max={23}
            value={policy.allowedWindowStartHr ?? ""}
            onChange={(event) =>
              setPolicy((previous) => ({
                ...previous,
                allowedWindowStartHr:
                  event.target.value === "" ? undefined : Number(event.target.value),
              }))
            }
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Window End (UTC)</span>
          <input
            type="number"
            min={0}
            max={23}
            value={policy.allowedWindowEndHr ?? ""}
            onChange={(event) =>
              setPolicy((previous) => ({
                ...previous,
                allowedWindowEndHr: event.target.value === "" ? undefined : Number(event.target.value),
              }))
            }
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={policy.requireHttps}
          onChange={(event) =>
            setPolicy((previous) => ({
              ...previous,
              requireHttps: event.target.checked,
            }))
          }
        />
        Require HTTPS targets
      </label>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={savePolicy} disabled={state.saving}>
          {state.saving ? "Saving..." : "Save Policy"}
        </Button>
        {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
        {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
      </div>
    </div>
  );
}
