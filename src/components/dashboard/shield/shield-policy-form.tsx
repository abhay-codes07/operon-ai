"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ShieldPolicyFormProps = {
  initialAllowedDomains: string[];
  initialBlockedActions: string[];
};

export function ShieldPolicyForm({
  initialAllowedDomains,
  initialBlockedActions,
}: ShieldPolicyFormProps): JSX.Element {
  const [allowedDomains, setAllowedDomains] = useState(initialAllowedDomains.join("\n"));
  const [blockedActions, setBlockedActions] = useState(initialBlockedActions.join("\n"));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/shield/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowedDomains: allowedDomains
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          blockedActions: blockedActions
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setStatusMessage(payload?.error?.message ?? "Failed to save Shield policy");
        return;
      }
      setStatusMessage("Shield policy updated.");
    } catch {
      setStatusMessage("Network error while updating Shield policy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-300">Allowed Domains</span>
          <textarea
            className="min-h-[140px] w-full rounded-lg border border-[#1e2d5a]/60 bg-[#060b18] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            value={allowedDomains}
            onChange={(event) => setAllowedDomains(event.target.value)}
            placeholder="example.com"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-300">Blocked Actions</span>
          <textarea
            className="min-h-[140px] w-full rounded-lg border border-[#1e2d5a]/60 bg-[#060b18] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            value={blockedActions}
            onChange={(event) => setBlockedActions(event.target.value)}
            placeholder="submit_payment"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Shield Policy"}
        </Button>
        {statusMessage ? <p className="text-xs text-slate-400">{statusMessage}</p> : null}
      </div>
    </form>
  );
}
