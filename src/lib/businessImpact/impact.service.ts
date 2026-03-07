import { prisma } from "@/server/db/client";

export async function suggestDollarValuePerRun(workflow: {
  definition: { steps?: Array<{ action?: string }> } | null;
  scheduleCron?: string | null;
}) {
  const stepCount = workflow.definition?.steps?.length ?? 1;
  const schedulePremium = workflow.scheduleCron ? 1.3 : 1;
  return Number((stepCount * 12 * schedulePremium).toFixed(2));
}

export async function calculateWorkflowROI(workflowId: string) {
  const impact = await prisma.workflowBusinessImpact.findUnique({
    where: { workflowId },
  });
  if (!impact) {
    return null;
  }

  const runs = await prisma.execution.count({
    where: {
      workflowId,
      status: "SUCCEEDED",
    },
  });

  const monthlyRuns = await prisma.execution.count({
    where: {
      workflowId,
      status: "SUCCEEDED",
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const totalValue = Number((runs * impact.estimatedDollarValuePerRun).toFixed(2));
  const monthlyValue = Number((monthlyRuns * impact.estimatedDollarValuePerRun).toFixed(2));

  return {
    workflowId,
    category: impact.category,
    teamOwner: impact.teamOwner,
    businessObjective: impact.businessObjective,
    estimatedDollarValuePerRun: impact.estimatedDollarValuePerRun,
    totalRuns: runs,
    totalValue,
    monthlyRuns,
    monthlyValue,
  };
}

export async function calculateMonthlyImpact(orgId: string) {
  const impacts = await prisma.workflowBusinessImpact.findMany({
    where: {
      workflow: {
        organizationId: orgId,
      },
    },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
    },
  });

  const results = await Promise.all(
    impacts.map(async (impact) => {
      const runs = await prisma.execution.count({
        where: {
          workflowId: impact.workflowId,
          status: "SUCCEEDED",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });
      return {
        workflowId: impact.workflowId,
        workflowName: impact.workflow.name,
        category: impact.category,
        runs,
        value: Number((runs * impact.estimatedDollarValuePerRun).toFixed(2)),
      };
    }),
  );

  const totalRuns = results.reduce((acc, item) => acc + item.runs, 0);
  const totalSavings = results
    .filter((item) => item.category === "COST_SAVINGS")
    .reduce((acc, item) => acc + item.value, 0);
  const totalRevenueProtected = results
    .filter((item) => item.category === "REVENUE_PROTECTION")
    .reduce((acc, item) => acc + item.value, 0);

  return {
    totalRuns,
    totalSavings: Number(totalSavings.toFixed(2)),
    totalRevenueProtected: Number(totalRevenueProtected.toFixed(2)),
    totalROI: Number(results.reduce((acc, item) => acc + item.value, 0).toFixed(2)),
    workflows: results.sort((a, b) => b.value - a.value),
  };
}

export async function createWorkflowBusinessImpact(input: {
  workflowId: string;
  category: "REVENUE_PROTECTION" | "COST_SAVINGS" | "COMPLIANCE" | "GROWTH";
  estimatedDollarValuePerRun: number;
  teamOwner: string;
  businessObjective: string;
}) {
  return prisma.workflowBusinessImpact.upsert({
    where: { workflowId: input.workflowId },
    create: input,
    update: {
      category: input.category,
      estimatedDollarValuePerRun: input.estimatedDollarValuePerRun,
      teamOwner: input.teamOwner,
      businessObjective: input.businessObjective,
    },
  });
}
