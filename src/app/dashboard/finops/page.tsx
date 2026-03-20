import Link from "next/link";

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Agent Cost Intelligence</h1>
        <p className="text-yellow-100 text-lg">Operon FinOps</p>
        <p className="text-yellow-200 text-sm mt-2">Cost attribution, budget posture, anomaly detection, and ROI scoring.</p>
      </div>

      {/* Live Summary */}
      <FinOpsLiveSummary
        initial={{
          totalSpendUsd: monthly.totalUsd,
          anomalyCount: anomalies.length,
          workflowCount: monthly.workflows.length,
        }}
      />

      {/* Main Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Cost Ranking */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Workflow Cost Ranking</h2>
          {monthly.workflows.length === 0 ? (
            <p className="text-slate-500">No workflow cost events yet.</p>
          ) : (
            <div className="space-y-3">
              {monthly.workflows.map((item) => (
                <Link key={item.workflowId} href={`/workflows/${item.workflowId}/finops`} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-amber-500/50 transition-colors block">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-white font-semibold">{item.workflowName}</p>
                    <p className="text-lg font-bold text-yellow-400">${item.totalUsd.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-slate-500">Click to view detailed cost analysis</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ROI Ranking */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <h2 className="text-2xl font-bold text-white mb-6">ROI Ranking</h2>
          {roiItems.length === 0 ? (
            <p className="text-slate-500">No ROI profiles available yet.</p>
          ) : (
            <div className="space-y-3">
              {roiItems.slice(0, 20).map((item) => (
                <div key={item.workflowId} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-green-500/50 transition-colors">
                  <p className="text-white font-semibold mb-2">{item.workflowName}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-slate-400">Value/Run <span className="text-green-400 font-semibold">${item.valuePerRun.toFixed(2)}</span></div>
                    <div className="text-slate-400">Cost/Run <span className="text-orange-400 font-semibold">${item.costPerRun.toFixed(4)}</span></div>
                    <div className="text-slate-400">ROI <span className={item.roi && item.roi > 0 ? "text-green-400 font-semibold" : "text-slate-500"}>{item.roi ? item.roi.toFixed(2) : "N/A"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cost Anomaly Alerts */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Cost Anomaly Alerts</h2>
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
      </div>
    </div>
  );
}
