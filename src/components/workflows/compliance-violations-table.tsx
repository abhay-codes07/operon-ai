type ComplianceViolationTableItem = {
  id: string;
  violationType: string;
  description: string;
  detectedAt: Date;
  run?: {
    id: string;
    status: string;
  } | null;
};

type ComplianceViolationsTableProps = {
  items: ComplianceViolationTableItem[];
};

export function ComplianceViolationsTable({ items }: ComplianceViolationsTableProps): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/40 p-4 text-sm text-slate-400">
        No compliance violations detected.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e2d5a]/60">
      <table className="min-w-full divide-y divide-[#1e2d5a]/40 bg-[#0d1428]/80">
        <thead className="bg-[#060b18]/60">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Type</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Description</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Run</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Detected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2d5a]/30">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[#1e2d5a]/20">
              <td className="px-3 py-2 text-xs font-semibold text-white">{item.violationType}</td>
              <td className="px-3 py-2 text-sm text-slate-300">{item.description}</td>
              <td className="px-3 py-2 text-xs text-slate-400">{item.run?.status ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{new Date(item.detectedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
