import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { FinOpsAnomalyAlerts } from "@/components/dashboard/finops/finops-anomaly-alerts";
import { FinOpsLiveSummary } from "@/components/dashboard/finops/finops-live-summary";
import { listCostAnomalies } from "@/lib/finops/anomaly.service";
import { getMonthlyCost } from "@/lib/finops/cost-aggregation.service";
import { getOrganizationROI } from "@/lib/finops/roi.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardFinOpsPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [monthly, roiItems, anomalies] = await Promise.all([
    getMonthlyCost(user.organizationId!),
    getOrganizationROI(user.organizationId!),
    listCostAnomalies(user.organizationId!),
  ]);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operon FinOps"
        title="Agent Cost Intelligence"
        description="Cost attribution, budget posture, anomaly detection, and ROI scoring."
      />

      <FinOpsLiveSummary
        initial={{
          totalSpendUsd: monthly.totalUsd,
          anomalyCount: anomalies.length,
          workflowCount: monthly.workflows.length,
        }}
      />

      <DashboardCard title="Workflow Cost Ranking">
        <div className="space-y-2">
          {monthly.workflows.length === 0 ? (
            <p className="text-sm text-slate-600">No workflow cost events yet.</p>
          ) : (
            monthly.workflows.map((item) => (
              <article key={item.workflowId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.workflowName}</p>
                  <p className="text-xs font-semibold text-slate-700">${item.totalUsd.toFixed(2)}</p>
                </div>
                <Link href={`/workflows/${item.workflowId}/finops`} className="text-xs text-slate-600 underline">
                  Open workflow cost view
                </Link>
              </article>
            ))
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="ROI Ranking">
        <div className="space-y-2">
          {roiItems.length === 0 ? (
            <p className="text-sm text-slate-600">No ROI profiles available yet.</p>
          ) : (
            roiItems.slice(0, 20).map((item) => (
              <article key={item.workflowId} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{item.workflowName}</p>
                <p className="text-xs text-slate-600">
                  Value/Run ${item.valuePerRun.toFixed(2)} • Cost/Run ${item.costPerRun.toFixed(4)} • ROI{" "}
                  {item.roi ? item.roi.toFixed(2) : "N/A"}
                </p>
              </article>
            ))
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Cost Anomaly Alerts">
        <FinOpsAnomalyAlerts
          items={anomalies.map((item) => ({
            id: item.id,
            expectedCost: Number(item.expectedCost),
            actualCost: Number(item.actualCost),
            anomalyFactor: Number(item.anomalyFactor),
            reason: item.reason,
            workflow: item.workflow,
          }))}
        />
      </DashboardCard>
    </div>
  );
}
