"use client";

import { useMemo, useState } from "react";

type ReplayStep = {
  id: string;
  stepIndex: number;
  stepKey: string;
  action: string;
  target?: string | null;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
  metadata?: Record<string, unknown> | null;
};

type DomSnapshot = {
  id: string;
  executionStepId?: string | null;
  pageUrl?: string | null;
  domHtml: string;
  capturedAt: string;
};

type ExecutionReplayViewerProps = {
  steps: ReplayStep[];
  snapshots: DomSnapshot[];
};

const stepStatusClasses: Record<ReplayStep["status"], string> = {
  PENDING: "bg-slate-100 text-slate-700",
  RUNNING: "bg-sky-100 text-sky-700",
  SUCCEEDED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
  SKIPPED: "bg-amber-100 text-amber-700",
};

export function ExecutionReplayViewer({
  steps,
  snapshots,
}: ExecutionReplayViewerProps): JSX.Element {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(steps[0]?.id ?? null);

  const selectedSnapshots = useMemo(() => {
    if (!selectedStepId) {
      return snapshots;
    }

    return snapshots.filter((item) => item.executionStepId === selectedStepId);
  }, [selectedStepId, snapshots]);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Replay Steps</p>
        </div>
        <ol className="max-h-[440px] overflow-auto divide-y divide-slate-100">
          {steps.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setSelectedStepId(step.id)}
                className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selectedStepId === step.id ? "bg-slate-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Step {step.stepIndex + 1}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      stepStatusClasses[step.status]
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{step.action}</p>
                <p className="text-xs text-slate-500">{step.target ?? step.stepKey}</p>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-950 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">DOM Snapshot</p>
        {selectedSnapshots.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No snapshots were captured for the selected step.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {selectedSnapshots.map((snapshot) => (
              <article key={snapshot.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <p className="text-[11px] text-slate-400">
                  {new Date(snapshot.capturedAt).toLocaleString()}
                  {snapshot.pageUrl ? ` • ${snapshot.pageUrl}` : ""}
                </p>
                <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-100">
                  {snapshot.domHtml}
                </pre>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
