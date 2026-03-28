"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ShieldBaselineFormProps = {
  workflowId: string;
  initialAllowedActions: string[];
  initialAllowedDomains: string[];
};

export function ShieldBaselineForm({
  workflowId,
  initialAllowedActions,
  initialAllowedDomains,
}: ShieldBaselineFormProps): JSX.Element {
  const [allowedActions, setAllowedActions] = useState(initialAllowedActions.join("\n"));
  const [allowedDomains, setAllowedDomains] = useState(initialAllowedDomains.join("\n"));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inferring, setInferring] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/shield/workflows/${workflowId}/baseline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowedActions: allowedActions
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          allowedDomains: allowedDomains
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(payload?.error?.message ?? "Failed to save baseline");
        return;
      }
      setStatus("Baseline updated.");
    } catch {
      setStatus("Network error while saving baseline.");
    } finally {
      setSaving(false);
    }
  }

  async function onInfer() {
    setInferring(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/shield/workflows/${workflowId}/baseline/infer`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(payload?.error?.message ?? "Failed to infer baseline");
        return;
      }
      const inferred = payload?.inferred as { allowedActions?: string[]; allowedDomains?: string[] } | undefined;
      setAllowedActions((inferred?.allowedActions ?? []).join("\n"));
      setAllowedDomains((inferred?.allowedDomains ?? []).join("\n"));
      setStatus("Baseline inferred from workflow definition.");
    } catch {
      setStatus("Network error while inferring baseline.");
    } finally {
      setInferring(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-300">Allowed Actions</span>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-[#1e2d5a]/60 bg-[#060b18] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            value={allowedActions}
            onChange={(event) => setAllowedActions(event.target.value)}
            placeholder="click\nextract\nnavigate"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-300">Allowed Domains</span>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-[#1e2d5a]/60 bg-[#060b18] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            value={allowedDomains}
            onChange={(event) => setAllowedDomains(event.target.value)}
            placeholder="example.com"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Baseline"}
        </Button>
        <Button type="button" variant="secondary" onClick={onInfer} disabled={inferring || saving}>
          {inferring ? "Inferring..." : "Infer from Workflow"}
        </Button>
        {status ? <p className="text-xs text-slate-400">{status}</p> : null}
      </div>
    </form>
  );
}
