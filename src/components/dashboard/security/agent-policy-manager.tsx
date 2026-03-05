"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type AgentOption = {
  id: string;
  name: string;
};

type AgentPolicyManagerProps = {
  agents: AgentOption[];
  initialPolicies: Array<{
    id: string;
    agentId: string;
    enabled: boolean;
    maxRunsPerHour: number;
    updatedAt: string;
  }>;
};

export function AgentPolicyManager({ agents, initialPolicies }: AgentPolicyManagerProps): JSX.Element {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [enabled, setEnabled] = useState(true);
  const [maxRunsPerHour, setMaxRunsPerHour] = useState("120");
  const [domainAllowlist, setDomainAllowlist] = useState("");
  const [actionAllowlist, setActionAllowlist] = useState("");
  const [state, setState] = useState<{ saving: boolean; error?: string; success?: string }>({
    saving: false,
  });

  async function savePolicy() {
    setState({ saving: true });
    const response = await fetch("/api/internal/security/agent-policies", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        enabled,
        maxRunsPerHour: Number(maxRunsPerHour),
        timezone: "UTC",
        domainAllowlist: domainAllowlist
          .split("\n")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
        actionAllowlist: actionAllowlist
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setState({ saving: false, error: payload?.error ?? "Unable to save policy" });
      return;
    }

    setState({ saving: false, success: "Policy saved" });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active Agent Policies</p>
        {initialPolicies.length === 0 ? (
          <p className="mt-2 text-xs text-slate-600">No agent-level policies configured.</p>
        ) : (
          <div className="mt-2 space-y-1">
            {initialPolicies.map((item) => (
              <p key={item.id} className="text-xs text-slate-700">
                {agents.find((agent) => agent.id === item.agentId)?.name ?? item.agentId.slice(-8)} •{" "}
                {item.enabled ? "Enabled" : "Disabled"} • Limit {item.maxRunsPerHour}/hr
              </p>
            ))}
          </div>
        )}
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Agent</span>
        <select
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          value={agentId}
          onChange={(event) => setAgentId(event.target.value)}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Domain Allowlist</span>
        <textarea
          value={domainAllowlist}
          onChange={(event) => setDomainAllowlist(event.target.value)}
          className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="example.com&#10;admin.example.com"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Action Allowlist</span>
        <input
          value={actionAllowlist}
          onChange={(event) => setActionAllowlist(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          placeholder="navigate,click,extract,submit"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Max Runs / Hour</span>
        <input
          type="number"
          min={1}
          max={2000}
          value={maxRunsPerHour}
          onChange={(event) => setMaxRunsPerHour(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
        Enable policy enforcement
      </label>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={savePolicy} disabled={state.saving}>
          {state.saving ? "Saving..." : "Save Agent Policy"}
        </Button>
        {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
        {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
      </div>
    </div>
  );
}
