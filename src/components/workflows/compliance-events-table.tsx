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
      <div className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/40 p-4 text-sm text-slate-400">
        No compliance events captured yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e2d5a]/60">
      <table className="min-w-full divide-y divide-[#1e2d5a]/40 bg-[#0d1428]/80">
        <thead className="bg-[#060b18]/60">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Domain</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Data Category</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2d5a]/30">
          {items.map((event) => (
            <tr key={event.id} className="hover:bg-[#1e2d5a]/20">
              <td className="px-3 py-2 text-xs font-semibold text-white">{event.actionType}</td>
              <td className="px-3 py-2 text-sm text-slate-300">{event.domainVisited ?? "-"}</td>
              <td className="px-3 py-2 text-sm text-slate-300">{event.dataCategory ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
