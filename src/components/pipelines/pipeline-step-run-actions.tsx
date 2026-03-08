"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type PipelineStepRunActionsProps = {
  pipelineRunId: string;
  stepRunId: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
};

export function PipelineStepRunActions({
  pipelineRunId,
  stepRunId,
  status,
}: PipelineStepRunActionsProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invoke(action: "retry" | "skip") {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/pipelines/run/${pipelineRunId}/steps/${stepRunId}/${action}`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    setLoading(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? `Failed to ${action} step`);
      return;
    }
    window.location.reload();
  }

  if (status !== "FAILED" && status !== "RUNNING") {
    return <span className="text-xs text-slate-500">-</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => invoke("retry")}
        disabled={loading}
      >
        Retry
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => invoke("skip")}
        disabled={loading}
      >
        Skip
      </Button>
      {error ? <span className="text-xs text-rose-700">{error}</span> : null}
    </div>
  );
}
