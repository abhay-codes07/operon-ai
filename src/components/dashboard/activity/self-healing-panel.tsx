"use client";

type SelfHealingRecord = {
  id: string;
  originalSelector?: string | null;
  resolvedSelector: string;
  strategy: string;
  similarityScore: number;
  success: boolean;
  createdAt: string;
};

type SelfHealingPanelProps = {
  records: SelfHealingRecord[];
};

export function SelfHealingPanel({ records }: SelfHealingPanelProps): JSX.Element {
  if (records.length === 0) {
    return <p className="text-sm text-slate-600">No self-healing decisions recorded for this execution.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selector Recovery
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Strategy
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((record) => (
            <tr key={record.id} className="text-sm text-slate-700">
              <td className="px-4 py-3">{new Date(record.createdAt).toLocaleTimeString()}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{record.resolvedSelector}</p>
                <p className="text-xs text-slate-500">{record.originalSelector ?? "No primary selector"}</p>
              </td>
              <td className="px-4 py-3">{record.strategy}</td>
              <td className="px-4 py-3">
                <span className={record.success ? "text-emerald-700" : "text-rose-700"}>
                  {(record.similarityScore * 100).toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
