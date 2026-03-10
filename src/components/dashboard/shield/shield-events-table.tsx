"use client";

type ShieldEventItem = {
  id: string;
  url: string;
  domLocation: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  detectedAt: string;
  workflow: {
    id: string;
    name: string;
  };
  run: {
    id: string;
    status: string;
  };
};

type ShieldEventsTableProps = {
  items: ShieldEventItem[];
};

const severityTone: Record<ShieldEventItem["severity"], string> = {
  LOW: "border-slate-200 bg-slate-100 text-slate-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
};

export function ShieldEventsTable({ items }: ShieldEventsTableProps): JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600">No prompt injection events detected.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Target</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Run</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-3 text-xs text-slate-600">
                {new Date(item.detectedAt).toLocaleString()}
              </td>
              <td className="px-3 py-3 text-sm font-medium text-slate-900">{item.workflow.name}</td>
              <td className="px-3 py-3 text-xs text-slate-700">
                <p>{item.url}</p>
                {item.domLocation ? <p className="text-slate-500">{item.domLocation}</p> : null}
              </td>
              <td className="px-3 py-3">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${severityTone[item.severity]}`}>
                  {item.severity} ({item.riskScore})
                </span>
              </td>
              <td className="px-3 py-3 text-xs text-slate-600">
                {item.run.id.slice(-8)} ({item.run.status})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
