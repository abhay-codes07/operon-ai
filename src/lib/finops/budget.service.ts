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

export async function applyThrottlingStrategy(workflowId: string) {
  const budgetState = await checkBudget(workflowId);
  if (!budgetState) {
    return null;
  }

  if (!budgetState.exceededBudget) {
    return {
      action: "NO_ACTION",
      workflowId,
    } as const;
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, status: true, scheduleCron: true, definition: true },
  });
  if (!workflow) {
    return null;
  }

  await prisma.workflow.update({
    where: { id: workflow.id },
    data: {
      status: "PAUSED",
      scheduleCron: null,
      definition: {
        ...(workflow.definition as Record<string, unknown>),
        runtimeHints: {
          modelTier: "economy",
          reason: "budget_exceeded",
        },
      },
    },
  });

  return {
    action: "PAUSED_WORKFLOW_AND_SWITCHED_TO_ECONOMY_MODEL_HINT",
    workflowId: workflow.id,
  } as const;
}
