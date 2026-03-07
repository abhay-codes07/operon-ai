type WorkflowImpactItem = {
  workflowId: string;
  workflowName: string;
  category: "REVENUE_PROTECTION" | "COST_SAVINGS" | "COMPLIANCE" | "GROWTH";
  runs: number;
  value: number;
};

export function ImpactSummary(props: {
  totalROI: number;
  totalRuns: number;
  totalSavings: number;
  totalRevenueProtected: number;
  workflows: WorkflowImpactItem[];
}): JSX.Element {
  const maxValue = props.workflows.length > 0 ? Math.max(...props.workflows.map((item) => item.value)) : 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total ROI</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">${props.totalROI.toFixed(2)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total Runs</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{props.totalRuns}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Cost Savings</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">${props.totalSavings.toFixed(2)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Revenue Protected</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">${props.totalRevenueProtected.toFixed(2)}</p>
        </article>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Workflow Value Ranking</h3>
        {props.workflows.map((workflow) => (
          <article key={workflow.workflowId} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{workflow.workflowName}</span>
              <span>${workflow.value.toFixed(2)}</span>
            </div>
            <div className="h-2 rounded bg-slate-100">
              <div
                className="h-2 rounded bg-slate-900"
                style={{ width: `${Math.max(2, (workflow.value / maxValue) * 100)}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
