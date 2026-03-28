"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ToolCardProps = {
  tool: {
    id: string;
    name: string;
    description: string;
    usageCount: number;
    reliabilityScore: number;
    currentVersionId?: string | null;
  };
  workflows: Array<{
    id: string;
    name: string;
  }>;
};

export function ToolCard({ tool, workflows }: ToolCardProps): JSX.Element {
  const [workflowId, setWorkflowId] = useState<string>(workflows[0]?.id ?? "");
  const [state, setState] = useState<{
    installing: boolean;
    validating?: boolean;
    validationScore?: number;
    message?: string;
  }>({ installing: false });

  async function install() {
    if (!workflowId || !tool.currentVersionId) {
      setState({ installing: false, message: "Select workflow and valid tool version." });
      return;
    }

    setState({ installing: true });
    const response = await fetch(`/api/internal/workflows/${workflowId}/tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolId: tool.id,
        toolVersionId: tool.currentVersionId,
      }),
    });
    setState({
      installing: false,
      message: response.ok ? "Installed" : "Install failed",
    });
  }

  async function validateTool() {
    setState((prev) => ({ ...prev, validating: true }));
    const response = await fetch(`/api/internal/tools/${tool.id}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      setState((prev) => ({ ...prev, validating: false, message: "Validation failed" }));
      return;
    }

    const payload = (await response.json()) as { result: { validationScore: number } };
    setState((prev) => ({
      ...prev,
      validating: false,
      validationScore: payload.result.validationScore,
      message: "Validated",
    }));
  }

  return (
    <article className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
      <p className="text-sm font-semibold text-white">{tool.name}</p>
      <p className="mt-1 text-sm text-slate-400">{tool.description}</p>
      <p className="mt-2 text-xs text-slate-500">
        Reliability {tool.reliabilityScore.toFixed(1)} • Usage {tool.usageCount}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={workflowId}
          onChange={(event) => setWorkflowId(event.target.value)}
          className="h-9 rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-2 text-sm text-white"
        >
          {workflows.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={install} disabled={state.installing}>
          {state.installing ? "Installing..." : "Install"}
        </Button>
        <Button type="button" variant="ghost" onClick={validateTool} disabled={state.validating}>
          {state.validating ? "Validating..." : "Validate"}
        </Button>
      </div>
      {typeof state.validationScore === "number" ? (
        <p className="mt-2 text-xs text-slate-400">Validation score: {state.validationScore.toFixed(1)}</p>
      ) : null}
      {state.message ? <p className="mt-2 text-xs text-slate-400">{state.message}</p> : null}
    </article>
  );
}
