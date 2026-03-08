"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type PipelineRunsLivePanelProps = {
  pipelineId: string;
  initialRuns: Array<{
    id: string;
    status: "RUNNING" | "PAUSED" | "FAILED" | "COMPLETED";
    startedAt: string;
    completedAt?: string | null;
  }>;
};

export function PipelineRunsLivePanel({
  pipelineId,
  initialRuns,
}: PipelineRunsLivePanelProps): JSX.Element {
  const [runs, setRuns] = useState(initialRuns);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/pipelines/${pipelineId}/runs`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      runs: Array<{
        id: string;
        status: "RUNNING" | "PAUSED" | "FAILED" | "COMPLETED";
        startedAt: string;
        completedAt?: string | null;
      }>;
    };
    setRuns(
      payload.runs.map((run) => ({
        ...run,
        startedAt: new Date(run.startedAt).toISOString(),
        completedAt: run.completedAt ? new Date(run.completedAt).toISOString() : null,
      })),
    );
  }, [pipelineId]);

  usePolling(refresh, 8_000, true);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Live Run Status</h2>
      {runs.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No runs to monitor yet.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {runs.slice(0, 8).map((run) => (
            <article key={run.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="text-xs font-semibold text-slate-900">{run.id.slice(-8)}</p>
              <p className="text-xs text-slate-600">
                {run.status} • {new Date(run.startedAt).toLocaleTimeString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
