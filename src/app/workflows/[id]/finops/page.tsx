import { notFound } from "next/navigation";

import { FinOpsBudgetForm } from "@/components/workflows/finops-budget-form";
import { getWorkflowFinopsSnapshot } from "@/lib/finops/workflow-finops.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type WorkflowFinOpsPageProps = {
  params: {
    id: string;
  };
};

export default async function WorkflowFinOpsPage({
  params,
}: WorkflowFinOpsPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const snapshot = await getWorkflowFinopsSnapshot(params.id);
  if (!snapshot || snapshot.workflow.organizationId !== user.organizationId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workflow FinOps</p>
        <h1 className="text-2xl font-semibold text-slate-900">{snapshot.workflow.name}</h1>
        <p className="text-sm text-slate-600">Cost attribution, budget usage, and ROI posture for this workflow.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Cost per Run</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">${snapshot.averageCost.avgCostPerRun.toFixed(4)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Monthly Cost</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">${snapshot.monthly.totalUsd.toFixed(2)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">ROI Score</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {snapshot.roi.roi ? snapshot.roi.roi.toFixed(2) : "N/A"}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Budget Usage</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {snapshot.budget
              ? `${((snapshot.budget.workflowSpend / Number(snapshot.budget.budget.monthlyBudgetUsd)) * 100).toFixed(1)}%`
              : "No budget"}
          </p>
        </article>
      </section>

      <FinOpsBudgetForm
        workflowId={snapshot.workflow.id}
        initialMonthlyBudgetUsd={Number(snapshot.budget?.budget.monthlyBudgetUsd ?? 100)}
        initialAlertThresholdPercent={snapshot.budget?.budget.alertThresholdPercent ?? 80}
      />
    </div>
  );
}
