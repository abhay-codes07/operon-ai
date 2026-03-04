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

export function FailureAnalysisPanel({ analysis }: FailureAnalysisPanelProps): JSX.Element {
  if (!analysis) {
    return <p className="text-sm text-slate-600">No failure analysis available for this execution.</p>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Root Cause Category</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{analysis.category}</p>
      <p className="mt-2 text-sm text-slate-700">{analysis.summary}</p>
      {analysis.evidence ? (
        <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(analysis.evidence, null, 2)}
        </pre>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">Updated: {new Date(analysis.updatedAt).toLocaleString()}</p>
    </div>
  );
}
