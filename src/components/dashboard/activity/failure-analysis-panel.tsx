"use client";

type FailureAnalysis = {
  id: string;
  category: "SELECTOR_DRIFT" | "NAVIGATION_FAILURE" | "AUTHENTICATION_ISSUE" | "PAGE_LOAD_TIMEOUT" | "UNKNOWN";
  summary: string;
  evidence?: Record<string, unknown> | null;
  updatedAt: string;
};

type FailureAnalysisPanelProps = {
  analysis?: FailureAnalysis | null;
};

const categoryBadge: Record<string, string> = {
  SELECTOR_DRIFT: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  NAVIGATION_FAILURE: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  AUTHENTICATION_ISSUE: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  PAGE_LOAD_TIMEOUT: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  UNKNOWN: "border-slate-600/60 bg-slate-800/60 text-slate-400",
};

export function FailureAnalysisPanel({ analysis }: FailureAnalysisPanelProps): JSX.Element {
  if (!analysis) {
    return <p className="text-sm text-slate-500">No failure analysis available for this execution.</p>;
  }

  const badge = categoryBadge[analysis.category] ?? categoryBadge.UNKNOWN;

  return (
    <div className="space-y-3 rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Root Cause</p>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${badge}`}>
          {analysis.category.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{analysis.summary}</p>
      {analysis.evidence ? (
        <pre className="max-h-56 overflow-auto rounded-lg border border-slate-700/60 bg-slate-900/60 p-3 text-xs text-slate-400">
          {JSON.stringify(analysis.evidence, null, 2)}
        </pre>
      ) : null}
      <p className="text-xs text-slate-600">Updated: {new Date(analysis.updatedAt).toLocaleString()}</p>
    </div>
  );
}
