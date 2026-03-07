type ComplianceEventTableItem = {
  id: string;
  domainVisited?: string | null;
  actionType: "READ" | "WRITE" | "SUBMIT" | "EXTRACT";
  dataCategory?: string | null;
  timestamp: Date;
};

type ComplianceEventsTableProps = {
  items: ComplianceEventTableItem[];
};

export function ComplianceEventsTable({ items }: ComplianceEventsTableProps): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No compliance events captured yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Domain</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Data Category</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((event) => (
            <tr key={event.id}>
              <td className="px-3 py-2 text-xs font-semibold text-slate-900">{event.actionType}</td>
              <td className="px-3 py-2 text-sm text-slate-700">{event.domainVisited ?? "-"}</td>
              <td className="px-3 py-2 text-sm text-slate-700">{event.dataCategory ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
