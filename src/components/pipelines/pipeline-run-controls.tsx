"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type PipelineRunControlsProps = {
  pipelineId: string;
  latestRunId?: string | null;
  latestRunStatus?: "RUNNING" | "PAUSED" | "FAILED" | "COMPLETED" | null;
};

export function PipelineRunControls({
  pipelineId,
  latestRunId,
  latestRunStatus,
}: PipelineRunControlsProps): JSX.Element {
  const [state, setState] = useState<{ loading: boolean; error?: string }>({ loading: false });

  async function startRun() {
    setState({ loading: true });
    const response = await fetch(`/api/pipelines/${pipelineId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: {} }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to start pipeline" });
      return;
    }
    setState({ loading: false });
    window.location.reload();
  }

  async function pauseRun() {
    if (!latestRunId) {
      return;
    }
    setState({ loading: true });
    const response = await fetch(`/api/pipelines/run/${latestRunId}/pause`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to pause pipeline" });
      return;
    }
    setState({ loading: false });
    window.location.reload();
  }

  async function resumeRun() {
    if (!latestRunId) {
      return;
    }
    setState({ loading: true });
    const response = await fetch(`/api/pipelines/run/${latestRunId}/resume`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to resume pipeline" });
      return;
    }
    setState({ loading: false });
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={startRun} disabled={state.loading}>
        Start Run
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={pauseRun}
        disabled={!latestRunId || latestRunStatus !== "RUNNING" || state.loading}
      >
        Pause
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={resumeRun}
        disabled={!latestRunId || latestRunStatus !== "PAUSED" || state.loading}
      >
        Resume
      </Button>
      {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
    </div>
  );
}
