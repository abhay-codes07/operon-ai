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
    <div className="space-y-3">
      {items.map((workflow) => (
        <div key={workflow.id} className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 hover:bg-[#0d1428] transition-colors">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
            {/* Workflow info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-white truncate">{workflow.name}</p>
                <WorkflowStatusBadge status={workflow.status} />
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                    workflow.complianceApproved
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {workflow.complianceApproved ? "✓ Approved" : "⚠ Pending"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2 line-clamp-1">
                {workflow.description ?? workflow.definition?.naturalLanguageTask ?? ""}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{workflow.scheduleCron ?? "Manual trigger"}</span>
                <span>·</span>
                <span>{workflow.definition?.steps?.length ?? 0} steps</span>
                <span>·</span>
                <span>Blast: {workflow.blastRadiusScore ?? 0}/100</span>
                {workflow.hasSla && (
                  <>
                    <span>·</span>
                    <WorkflowHealthBadge state={workflow.slaState} />
                  </>
                )}
              </div>
              <div className="mt-2 flex gap-3 text-xs">
                <Link href={`/workflows/${workflow.id}/sla`} className="text-cyan-400 hover:underline">SLA</Link>
                <Link href={`/workflows/${workflow.id}/compliance`} className="text-cyan-400 hover:underline">Compliance</Link>
                <Link href={`/workflows/${workflow.id}/finops`} className="text-cyan-400 hover:underline">FinOps</Link>
                <Link href={`/workflows/${workflow.id}/shield`} className="text-cyan-400 hover:underline">Shield</Link>
              </div>
            </div>
            {/* Actions */}
            <div className="flex-shrink-0">
              <RunWorkflowButton
                workflowId={workflow.id}
                disabled={workflow.status === "ARCHIVED"}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
