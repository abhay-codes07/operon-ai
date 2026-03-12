import Link from "next/link";

type CoPilotSessionItem = {
  id: string;
  startedAt: string;
  workflowName: string;
  runStatus: string;
  interventionCount: number;
};

type CoPilotSessionsTableProps = {
  items: CoPilotSessionItem[];
};

export function CoPilotSessionsTable({ items }: CoPilotSessionsTableProps) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? <p className="text-sm text-slate-600">No Co-Pilot sessions yet.</p> : null}
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.workflowName}</p>
              <p className="text-xs text-slate-600">
                Run {item.runStatus} • Interventions {item.interventionCount}
              </p>
              <p className="text-xs text-slate-500">{new Date(item.startedAt).toLocaleString()}</p>
            </div>
            <Link href={`/copilot/session/${item.id}`} className="text-xs font-semibold text-slate-700 underline">
              Open
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
