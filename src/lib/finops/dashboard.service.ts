import { listCostAnomalies } from "@/lib/finops/anomaly.service";
import { getMonthlyCost } from "@/lib/finops/cost-aggregation.service";
import { getOrganizationROI } from "@/lib/finops/roi.service";

export async function getFinOpsDashboardSummary(orgId: string) {
  const [monthly, roiItems, anomalies] = await Promise.all([
    getMonthlyCost(orgId),
    getOrganizationROI(orgId),
    listCostAnomalies(orgId),
  ]);

  return {
    totalSpendUsd: monthly.totalUsd,
    workflowCostRanking: monthly.workflows,
    topROI: roiItems.slice(0, 20),
    anomalies: anomalies.slice(0, 50),
    anomalyCount: anomalies.length,
  };
}
