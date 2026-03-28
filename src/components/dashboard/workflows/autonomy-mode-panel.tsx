"use client";

type AutonomyPayload = {
  proposal: {
    adaptationVersion: number;
    notes?: string | null;
  } | null;
  selectorHistory: Array<{
    id: string;
    stepKey: string;
    originalSelector: string;
    alternativeSelector: string;
    failCount: number;
    confidence: number;
  }>;
};

type AutonomyModePanelProps = {
  payload: AutonomyPayload;
};

export function AutonomyModePanel({ payload }: AutonomyModePanelProps): JSX.Element {
  return (
    <div className="mt-2 w-full rounded-lg border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-3 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400">Autonomy Mode</p>
      <p className="mt-1 text-xs text-slate-400">
        Proposal version {payload.proposal?.adaptationVersion ?? 0} •{" "}
        {payload.selectorHistory.length} selector alternatives learned
      </p>
      {payload.selectorHistory.slice(0, 4).map((item) => (
        <article key={item.id} className="mt-2 rounded border border-[#1e2d5a]/60 bg-[#060b18]/60 p-2 text-xs">
          <p className="font-semibold text-white">{item.stepKey}</p>
          <p className="text-slate-400">
            {item.originalSelector} → {item.alternativeSelector}
          </p>
          <p className="text-slate-500">Failures {item.failCount} • Confidence {(item.confidence * 100).toFixed(0)}%</p>
        </article>
      ))}
    </div>
  );
}
