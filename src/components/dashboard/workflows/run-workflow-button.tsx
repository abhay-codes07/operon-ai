"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type RunWorkflowButtonProps = {
  workflowId: string;
  disabled?: boolean;
};

export function RunWorkflowButton({ workflowId, disabled }: RunWorkflowButtonProps): JSX.Element {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRunWorkflow() {
    setIsRunning(true);
    setError(null);

    const response = await fetch(`/api/internal/workflows/${workflowId}/execute`, {
      method: "POST",
    });

    setIsRunning(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Run failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" onClick={onRunWorkflow} disabled={disabled || isRunning}>
        {isRunning ? "Running..." : "Run Now"}
      </Button>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
