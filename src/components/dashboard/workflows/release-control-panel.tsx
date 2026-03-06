"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type WorkflowOption = {
  id: string;
  name: string;
};

type ReleaseItem = {
  id: string;
  status: "ACTIVE" | "PAUSED" | "ROLLED_BACK" | "COMPLETED";
  canaryTrafficPercent: number;
  failureThresholdPct: number;
  minCanarySampleSize: number;
  autoRollbackEnabled: boolean;
  stableWorkflow: { id: string; name: string };
  canaryWorkflow: { id: string; name: string };
  metricSnapshots: Array<{
    canaryFailurePct: number;
    canarySampleSize: number;
    capturedAt: string;
  }>;
};

type ReleaseControlPanelProps = {
  workflows: WorkflowOption[];
  releases: ReleaseItem[];
};

export function ReleaseControlPanel({ workflows, releases }: ReleaseControlPanelProps): JSX.Element {
  const router = useRouter();
  const [stableWorkflowId, setStableWorkflowId] = useState(workflows[0]?.id ?? "");
  const [canaryWorkflowId, setCanaryWorkflowId] = useState(workflows[1]?.id ?? workflows[0]?.id ?? "");
  const [canaryTrafficPercent, setCanaryTrafficPercent] = useState("10");
  const [failureThresholdPct, setFailureThresholdPct] = useState("20");
  const [minCanarySampleSize, setMinCanarySampleSize] = useState("20");
  const [state, setState] = useState<{ saving: boolean; error?: string; success?: string }>({
    saving: false,
  });

  async function createRelease() {
    setState({ saving: true });
    const response = await fetch("/api/internal/workflows/releases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stableWorkflowId,
        canaryWorkflowId,
        canaryTrafficPercent: Number(canaryTrafficPercent),
        failureThresholdPct: Number(failureThresholdPct),
        minCanarySampleSize: Number(minCanarySampleSize),
        autoRollbackEnabled: true,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setState({ saving: false, error: payload?.error ?? "Failed to create release" });
      return;
    }

    setState({ saving: false, success: "Release created" });
    router.refresh();
  }

  async function rollback(releaseId: string) {
    await fetch(`/api/internal/workflows/releases/${releaseId}/rollback`, {
      method: "POST",
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Create Progressive Release</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <select
            value={stableWorkflowId}
            onChange={(event) => setStableWorkflowId(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          >
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                Stable: {workflow.name}
              </option>
            ))}
          </select>
          <select
            value={canaryWorkflowId}
            onChange={(event) => setCanaryWorkflowId(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          >
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                Canary: {workflow.name}
              </option>
            ))}
          </select>
          <input
            value={canaryTrafficPercent}
            onChange={(event) => setCanaryTrafficPercent(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            min={1}
            max={95}
            placeholder="Canary traffic %"
          />
          <input
            value={failureThresholdPct}
            onChange={(event) => setFailureThresholdPct(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            min={1}
            max={100}
            placeholder="Failure threshold %"
          />
          <input
            value={minCanarySampleSize}
            onChange={(event) => setMinCanarySampleSize(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm md:col-span-2"
            type="number"
            min={5}
            max={500}
            placeholder="Minimum canary sample size"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={createRelease} disabled={state.saving}>
            {state.saving ? "Creating..." : "Create Release"}
          </Button>
          {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
          {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
        </div>
      </div>

      <div className="space-y-3">
        {releases.map((release) => (
          <article key={release.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">
              {release.stableWorkflow.name} {"->"} {release.canaryWorkflow.name}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Status {release.status} • Canary Traffic {release.canaryTrafficPercent}% • Auto Rollback{" "}
              {release.autoRollbackEnabled ? "On" : "Off"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Threshold {release.failureThresholdPct}% • Min Sample {release.minCanarySampleSize}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Latest Canary Failure: {release.metricSnapshots[0]?.canaryFailurePct ?? 0}% on{" "}
              {release.metricSnapshots[0]
                ? new Date(release.metricSnapshots[0].capturedAt).toLocaleString()
                : "N/A"}
            </p>
            {release.status === "ACTIVE" ? (
              <div className="mt-3">
                <Button type="button" variant="secondary" onClick={() => rollback(release.id)}>
                  Rollback Release
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
