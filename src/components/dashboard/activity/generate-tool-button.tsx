"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type GenerateToolButtonProps = {
  executionId: string;
  agentId: string;
};

export function GenerateToolButton({
  executionId,
  agentId,
}: GenerateToolButtonProps): JSX.Element {
  const [state, setState] = useState<{ creating: boolean; message?: string }>({
    creating: false,
  });

  async function generateTool() {
    setState({ creating: true });
    const response = await fetch("/api/internal/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `tool-${executionId.slice(-6)}`,
        description: "Generated from failed execution context",
        createdByAgentId: agentId,
        workflowSteps: [{ id: "generated-step", action: "navigate", target: "https://example.com" }],
        generateFromExecutionId: executionId,
      }),
    });

    setState({
      creating: false,
      message: response.ok ? "Tool generated" : "Generation failed",
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" onClick={generateTool} disabled={state.creating}>
        {state.creating ? "Generating..." : "Generate Tool"}
      </Button>
      {state.message ? <p className="text-xs text-slate-600">{state.message}</p> : null}
    </div>
  );
}
