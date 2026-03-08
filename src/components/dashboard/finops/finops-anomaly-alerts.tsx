type FinOpsAnomalyItem = {
  id: string;
  expectedCost: number;
  actualCost: number;
  anomalyFactor: number;
  reason: string;
  workflow: {
    id: string;
    name: string;
  };
};

type FinOpsAnomalyAlertsProps = {
  items: FinOpsAnomalyItem[];
};

export function FinOpsAnomalyAlerts({ items }: FinOpsAnomalyAlertsProps): JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600">No cost anomalies detected.</p>;
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 20).map((item) => (
        <article key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">⚠ Workflow cost spike: {item.workflow.name}</p>
          <p className="text-xs text-amber-900">
            Expected ${item.expectedCost.toFixed(4)} • Actual ${item.actualCost.toFixed(4)} •{" "}
            {item.anomalyFactor.toFixed(2)}x
          </p>
          <p className="text-xs text-amber-800">{item.reason}</p>
        </article>
      ))}
    </div>
  );
}
