import { WorkflowStatusBadge } from "@/components/dashboard/status/workflow-status-badge";

type WorkflowTableItem = {
  id: string;
  name: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  scheduleCron?: string | null;
  createdAt: Date;
};

type WorkflowsTableProps = {
  items: WorkflowTableItem[];
};

export function WorkflowsTable({ items }: WorkflowsTableProps): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">No workflows created</p>
        <p className="mt-1 text-sm text-slate-600">Use the workflow builder to define your first automation flow.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((workflow) => (
            <tr key={workflow.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{workflow.name}</p>
                <p className="text-xs text-slate-500">{workflow.description ?? "No description"}</p>
              </td>
              <td className="px-4 py-3">
                <WorkflowStatusBadge status={workflow.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{workflow.scheduleCron ?? "Manual trigger"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
