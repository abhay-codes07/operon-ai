import { calculateAverageCost, getMonthlyCost, updateWorkflowCostSummary } from "@/lib/finops/cost-aggregation.service";
import { checkBudget } from "@/lib/finops/budget.service";
import { calculateWorkflowROI } from "@/lib/finops/roi.service";
import { prisma } from "@/server/db/client";

export async function getWorkflowFinopsSnapshot(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });
  if (!workflow) {
    return null;
  }

  const [summary, averageCost, monthly, budget, roi] = await Promise.all([
    updateWorkflowCostSummary(workflow.id),
    calculateAverageCost(workflow.id),
    getMonthlyCost(workflow.organizationId),
    checkBudget(workflow.id),
    calculateWorkflowROI(workflow.id),
  ]);

  const monthlyWorkflowCost =
    monthly.workflows.find((item) => item.workflowId === workflow.id)?.totalUsd ?? 0;

  return {
    workflow,
    summary,
    averageCost,
    monthly: {
      totalUsd: monthlyWorkflowCost,
      monthStart: monthly.monthStart,
      monthEnd: monthly.monthEnd,
    },
    budget,
    roi,
  };
}
