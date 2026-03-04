"use client";

type SimulationResult = {
  id: string;
  status: "READY" | "FAILED";
  predictedPath: Array<{
    order: number;
    stepId: string;
    action: string;
    target?: string | null;
    selectorValid: boolean;
  }>;
  warnings: string[];
  createdAt: string;
};

type SimulationPreviewPanelProps = {
  simulation: SimulationResult;
};

export function SimulationPreviewPanel({ simulation }: SimulationPreviewPanelProps): JSX.Element {
  return (
    <div className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Simulation</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            simulation.status === "READY" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {simulation.status}
        </span>
      </div>
      <ol className="mt-2 space-y-1 text-xs text-slate-600">
        {simulation.predictedPath.map((step) => (
          <li key={`${simulation.id}-${step.order}`}>
            {step.order}. {step.action} {step.target ? `on ${step.target}` : ""}{" "}
            <span className={step.selectorValid ? "text-emerald-700" : "text-rose-700"}>
              ({step.selectorValid ? "selector ok" : "selector risk"})
            </span>
          </li>
        ))}
      </ol>
      {simulation.warnings.length > 0 ? (
        <ul className="mt-2 list-disc pl-4 text-xs text-rose-700">
          {simulation.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
