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
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No compliance violations detected.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Run</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Detected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-2 text-xs font-semibold text-slate-900">{item.violationType}</td>
              <td className="px-3 py-2 text-sm text-slate-700">{item.description}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{item.run?.status ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{new Date(item.detectedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
