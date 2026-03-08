import Link from "next/link";
import { WorkflowStatusBadge } from "@/components/dashboard/status/workflow-status-badge";
import { WorkflowHealthBadge } from "@/components/dashboard/workflows/workflow-health-badge";
import { RunWorkflowButton } from "@/components/dashboard/workflows/run-workflow-button";

type WorkflowTableItem = {
  id: string;
  name: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  scheduleCron?: string | null;
  definition: {
    naturalLanguageTask: string;
    steps: Array<{ id: string }>;
  };
  slaState: "HEALTHY" | "WARNING" | "BREACHED";
  hasSla: boolean;
  complianceApproved: boolean;
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
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">SLA</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Schedule
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Steps
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((workflow) => (
            <tr key={workflow.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{workflow.name}</p>
                <p className="text-xs text-slate-500">
                  {workflow.description ?? workflow.definition.naturalLanguageTask}
                </p>
                <div className="mt-1 flex gap-2 text-xs">
                  <Link href={`/workflows/${workflow.id}/sla`} className="text-slate-700 hover:underline">
                    SLA
                  </Link>
                  <Link href={`/workflows/${workflow.id}/compliance`} className="text-slate-700 hover:underline">
                    Compliance
                  </Link>
                  <Link href={`/workflows/${workflow.id}/finops`} className="text-slate-700 hover:underline">
                    FinOps
                  </Link>
                </div>
              </td>
              <td className="px-4 py-3">
                <WorkflowStatusBadge status={workflow.status} />
              </td>
              <td className="px-4 py-3">
                {workflow.hasSla ? <WorkflowHealthBadge state={workflow.slaState} /> : <span className="text-xs text-slate-500">Not configured</span>}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    workflow.complianceApproved
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {workflow.complianceApproved ? "Approved" : "Pending"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{workflow.scheduleCron ?? "Manual trigger"}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{workflow.definition.steps.length}</td>
              <td className="px-4 py-3">
                <RunWorkflowButton
                  workflowId={workflow.id}
                  disabled={workflow.status === "ARCHIVED" || workflow.status === "DRAFT"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
