"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type AgentOption = {
  id: string;
  name: string;
};

type PipelineStepConfigFormProps = {
  pipelineId: string;
  agents: AgentOption[];
  nextStepOrder: number;
};

export function PipelineStepConfigForm({
  pipelineId,
  agents,
  nextStepOrder,
}: PipelineStepConfigFormProps): JSX.Element {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [inputMapping, setInputMapping] = useState("{}");
  const [outputMapping, setOutputMapping] = useState("{}");
  const [state, setState] = useState<{ loading: boolean; error?: string }>({ loading: false });

  async function onSubmit() {
    setState({ loading: true });

    let parsedInput: Record<string, unknown>;
    let parsedOutput: Record<string, unknown>;
    try {
      parsedInput = JSON.parse(inputMapping) as Record<string, unknown>;
      parsedOutput = JSON.parse(outputMapping) as Record<string, unknown>;
    } catch {
      setState({ loading: false, error: "Input and output mappings must be valid JSON." });
      return;
    }

    const response = await fetch(`/api/pipelines/${pipelineId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        stepOrder: nextStepOrder,
        inputMapping: parsedInput,
        outputMapping: parsedOutput,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to add pipeline step" });
      return;
    }

    setState({ loading: false });
    window.location.reload();
  }

  return (
    <section className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white">Add Pipeline Step</h2>
      <div className="mt-3 space-y-2">
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">Agent</span>
          <select
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            className="h-9 w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-2 text-sm text-white"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">Input Mapping JSON</span>
          <textarea
            rows={3}
            value={inputMapping}
            onChange={(event) => setInputMapping(event.target.value)}
            className="w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-2 py-1 text-xs text-white font-mono focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">Output Mapping JSON</span>
          <textarea
            rows={3}
            value={outputMapping}
            onChange={(event) => setOutputMapping(event.target.value)}
            className="w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-2 py-1 text-xs text-white font-mono focus:border-cyan-500/60 focus:outline-none"
          />
        </label>
        <Button type="button" onClick={onSubmit} disabled={state.loading}>
          {state.loading ? "Saving..." : "Add Step"}
        </Button>
        {state.error ? <p className="text-xs text-rose-400">{state.error}</p> : null}
      </div>
    </section>
  );
}
