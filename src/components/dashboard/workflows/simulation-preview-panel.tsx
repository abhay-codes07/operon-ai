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
    <div className="mt-2 w-full rounded-lg border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400">Simulation</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            simulation.status === "READY" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          }`}
        >
          {simulation.status}
        </span>
      </div>
      <ol className="mt-2 space-y-1 text-xs text-slate-400">
        {simulation.predictedPath.map((step) => (
          <li key={`${simulation.id}-${step.order}`}>
            {step.order}. {step.action} {step.target ? `on ${step.target}` : ""}{" "}
            <span className={step.selectorValid ? "text-emerald-400" : "text-rose-400"}>
              ({step.selectorValid ? "selector ok" : "selector risk"})
            </span>
          </li>
        ))}
      </ol>
      {simulation.warnings.length > 0 ? (
        <ul className="mt-2 list-disc pl-4 text-xs text-rose-400">
          {simulation.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
