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
    return <p className="text-sm text-slate-500">No self-healing decisions recorded for this execution.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-slate-700/60 bg-slate-800/60">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Selector Recovery
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Strategy
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40 bg-slate-800/20">
          {records.map((record) => (
            <tr key={record.id} className="text-sm text-slate-300 hover:bg-slate-800/40">
              <td className="px-4 py-3 text-slate-500 tabular-nums">{new Date(record.createdAt).toLocaleTimeString()}</td>
              <td className="px-4 py-3">
                <p className="font-mono text-xs font-medium text-slate-200">{record.resolvedSelector}</p>
                <p className="mt-0.5 text-xs text-slate-500">{record.originalSelector ?? "No primary selector"}</p>
              </td>
              <td className="px-4 py-3 text-slate-400">{record.strategy}</td>
              <td className="px-4 py-3">
                <span className={`font-semibold tabular-nums ${record.success ? "text-emerald-400" : "text-rose-400"}`}>
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
