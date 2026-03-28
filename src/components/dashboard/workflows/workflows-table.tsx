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
  blastRadiusScore: number | null;
  createdAt: Date;
};

type WorkflowsTableProps = {
  items: WorkflowTableItem[];
};

export function WorkflowsTable({ items }: WorkflowsTableProps): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#1e2d5a]/60 bg-[#0d1428]/40 p-8 text-center">
        <p className="text-sm font-semibold text-white">No workflows created</p>
        <p className="mt-1 text-sm text-slate-400">Use the workflow builder to define your first automation flow.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e2d5a]/60">
      <table className="min-w-full divide-y divide-[#1e2d5a]/40 bg-[#0d1428]/80">
        <thead className="bg-[#060b18]/60">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Workflow</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">SLA</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Compliance</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Schedule
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Steps
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2d5a]/30">
          {items.map((workflow) => (
            <tr key={workflow.id} className="transition-colors hover:bg-[#1e2d5a]/20">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-white">{workflow.name}</p>
                <p className="text-xs text-slate-400">
                  {workflow.description ?? workflow.definition.naturalLanguageTask}
                </p>
                <div className="mt-1 flex gap-2 text-xs">
                  <Link href={`/workflows/${workflow.id}/sla`} className="text-cyan-400 hover:underline">
                    SLA
                  </Link>
                  <Link href={`/workflows/${workflow.id}/compliance`} className="text-cyan-400 hover:underline">
                    Compliance
                  </Link>
                  <Link href={`/workflows/${workflow.id}/finops`} className="text-cyan-400 hover:underline">
                    FinOps
                  </Link>
                  <Link href={`/workflows/${workflow.id}/shield`} className="text-cyan-400 hover:underline">
                    Shield
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
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {workflow.complianceApproved ? "Approved" : "Pending"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">{workflow.scheduleCron ?? "Manual trigger"}</td>
              <td className="px-4 py-3 text-sm text-slate-400">
                {workflow.definition.steps.length}
                <div className="mt-1 text-xs text-slate-500">
                  Blast Radius: {workflow.blastRadiusScore ?? 0}/100{" "}
                  {(workflow.blastRadiusScore ?? 0) <= 10 ? "(Sandboxed)" : ""}
                </div>
              </td>
              <td className="px-4 py-3">
                <RunWorkflowButton
                  workflowId={workflow.id}
                  disabled={workflow.status === "ARCHIVED"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
