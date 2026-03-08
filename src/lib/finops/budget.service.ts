import { getMonthlyCost } from "@/lib/finops/cost-aggregation.service";
import { prisma } from "@/server/db/client";

export async function setWorkflowBudget(input: {
  orgId: string;
  workflowId: string;
  monthlyBudgetUsd: number;
  alertThresholdPercent: number;
}) {
  return prisma.costBudget.upsert({
    where: {
      orgId_workflowId: {
        orgId: input.orgId,
        workflowId: input.workflowId,
      },
    },
    create: {
      orgId: input.orgId,
      workflowId: input.workflowId,
      monthlyBudgetUsd: input.monthlyBudgetUsd,
      alertThresholdPercent: input.alertThresholdPercent,
    },
    update: {
      monthlyBudgetUsd: input.monthlyBudgetUsd,
      alertThresholdPercent: input.alertThresholdPercent,
    },
  });
}

export async function checkBudget(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, organizationId: true },
  });
  if (!workflow) {
    return null;
  }

  const budget = await prisma.costBudget.findUnique({
    where: {
      orgId_workflowId: {
        orgId: workflow.organizationId,
        workflowId: workflow.id,
      },
    },
  });
  if (!budget) {
    return null;
  }

  const monthly = await getMonthlyCost(workflow.organizationId);
  const workflowSpend = monthly.workflows.find((item) => item.workflowId === workflow.id)?.totalUsd ?? 0;
  const threshold = (Number(budget.monthlyBudgetUsd) * budget.alertThresholdPercent) / 100;
  const exceededThreshold = workflowSpend >= threshold;
  const exceededBudget = workflowSpend >= Number(budget.monthlyBudgetUsd);

  return {
    budget,
    workflowSpend,
    threshold,
    exceededThreshold,
    exceededBudget,
  };
}
