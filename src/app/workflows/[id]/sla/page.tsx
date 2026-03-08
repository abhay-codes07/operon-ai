import { notFound } from "next/navigation";

import { SLAConfigForm } from "@/components/workflows/sla-config-form";
import { SLAStatusIndicator } from "@/components/workflows/sla-status-indicator";
import Link from "next/link";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";
import { getWorkflowFinopsSnapshot } from "@/lib/finops/workflow-finops.service";

type WorkflowSLAConfigPageProps = {
  params: {
    id: string;
  };
};

export default async function WorkflowSLAConfigPage({
  params,
}: WorkflowSLAConfigPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: params.id,
      organizationId: user.organizationId!,
    },
    include: {
      workflowSLA: true,
    },
  });

  if (!workflow) {
    notFound();
  }

  const openIncidents = await prisma.sLABreachIncident.count({
    where: {
      workflowId: workflow.id,
      resolvedAt: null,
    },
  });
  const slaState =
    !workflow.workflowSLA
      ? "UNCONFIGURED"
      : openIncidents > 0
        ? "BREACHED"
        : workflow.workflowSLA.maxFailureRate <= 0.1
          ? "WARNING"
          : "HEALTHY";
  const finops = await getWorkflowFinopsSnapshot(workflow.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workflow SLA Contract</p>
        <h1 className="text-2xl font-semibold text-slate-900">{workflow.name}</h1>
        <p className="text-sm text-slate-600">Define failure, schedule, timeout, and escalation thresholds.</p>
        <div className="pt-1">
          <SLAStatusIndicator state={slaState} />
        </div>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <SLAConfigForm
          workflowId={workflow.id}
          initial={{
            expectedSchedule: workflow.workflowSLA?.expectedSchedule ?? workflow.scheduleCron ?? "*/15 * * * *",
            maxFailureRate: workflow.workflowSLA?.maxFailureRate ?? 0.2,
            maxExecutionTimeSeconds: workflow.workflowSLA?.maxExecutionTimeSeconds ?? 180,
            rollingWindowDays: workflow.workflowSLA?.rollingWindowDays ?? 7,
            notificationSlackChannel: workflow.workflowSLA?.notificationSlackChannel ?? "",
            notificationEmail: workflow.workflowSLA?.notificationEmail ?? "",
            escalationAfterBreaches: workflow.workflowSLA?.escalationAfterBreaches ?? 3,
          }}
        />
      </section>
      {finops ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">FinOps Snapshot</h2>
            <Link href={`/workflows/${workflow.id}/finops`} className="text-xs text-slate-700 underline">
              Open Full FinOps View
            </Link>
          </div>
          <div className="mt-2 grid gap-2 text-xs text-slate-700 md:grid-cols-2">
            <p>Cost/Run: ${finops.averageCost.avgCostPerRun.toFixed(4)}</p>
            <p>Monthly Cost: ${finops.monthly.totalUsd.toFixed(2)}</p>
            <p>ROI: {finops.roi.roi ? finops.roi.roi.toFixed(2) : "N/A"}</p>
            <p>
              Budget Usage:{" "}
              {finops.budget
                ? `${((finops.budget.workflowSpend / Number(finops.budget.budget.monthlyBudgetUsd)) * 100).toFixed(1)}%`
                : "No budget"}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
