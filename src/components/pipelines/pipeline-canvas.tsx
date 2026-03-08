"use client";

import { useMemo, useState } from "react";

type PipelineCanvasStep = {
  id: string;
  stepOrder: number;
  agentId: string;
  agentName: string;
  inputMapping: Record<string, unknown>;
  outputMapping: Record<string, unknown>;
};

type PipelineCanvasProps = {
  steps: PipelineCanvasStep[];
};

export function PipelineCanvas({ steps }: PipelineCanvasProps): JSX.Element {
  const [ordered, setOrdered] = useState([...steps].sort((a, b) => a.stepOrder - b.stepOrder));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const connections = useMemo(
    () =>
      ordered.slice(0, -1).map((step, index) => ({
        from: step.id,
        to: ordered[index + 1]?.id,
      })),
    [ordered],
  );

  function moveStep(sourceId: string, targetId: string) {
    const sourceIndex = ordered.findIndex((step) => step.id === sourceId);
    const targetIndex = ordered.findIndex((step) => step.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return;
    }

    const next = [...ordered];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setOrdered(
      next.map((step, index) => ({
        ...step,
        stepOrder: index + 1,
      })),
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Pipeline Canvas</h2>
        <p className="text-xs text-slate-600">Drag to reorder steps and inspect input/output mappings.</p>
      </div>

      <div className="space-y-2">
        {ordered.map((step) => (
          <article
            key={step.id}
            draggable
            onDragStart={() => setDraggingId(step.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggingId) {
                moveStep(draggingId, step.id);
              }
              setDraggingId(null);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <p className="text-xs font-semibold text-slate-500">Step {step.stepOrder}</p>
            <p className="text-sm font-semibold text-slate-900">{step.agentName}</p>
            <p className="text-xs text-slate-600">Agent ID: {step.agentId}</p>
            <p className="mt-1 text-xs text-slate-600">
              Input keys: {Object.keys(step.inputMapping ?? {}).length} • Output keys: {Object.keys(step.outputMapping ?? {}).length}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step Connections</p>
        {connections.length === 0 ? (
          <p className="text-xs text-slate-600">Single-step pipeline has no edge links.</p>
        ) : (
          <div className="mt-1 space-y-1 text-xs text-slate-700">
            {connections.map((connection) => (
              <p key={`${connection.from}-${connection.to}`}>{connection.from.slice(-6)} → {connection.to.slice(-6)}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
