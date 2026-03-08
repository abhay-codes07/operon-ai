import { prisma } from "@/server/db/client";

export async function calculateAverageCost(workflowId: string) {
  const [sum, runs] = await Promise.all([
    prisma.agentCostEvent.aggregate({
      where: { workflowId },
      _sum: { costUsd: true },
    }),
    prisma.execution.count({
      where: {
        workflowId,
        status: { in: ["SUCCEEDED", "FAILED", "CANCELED"] },
      },
    }),
  ]);

  const totalCost = Number(sum._sum.costUsd ?? 0);
  const avg = runs > 0 ? totalCost / runs : 0;
  return { totalCost, totalRuns: runs, avgCostPerRun: avg };
}

export async function updateWorkflowCostSummary(workflowId: string) {
  const snapshot = await calculateAverageCost(workflowId);
  return prisma.workflowCostSummary.upsert({
    where: { workflowId },
    create: {
      workflowId,
      totalCost: snapshot.totalCost,
      totalRuns: snapshot.totalRuns,
      avgCostPerRun: snapshot.avgCostPerRun,
      lastUpdated: new Date(),
    },
    update: {
      totalCost: snapshot.totalCost,
      totalRuns: snapshot.totalRuns,
      avgCostPerRun: snapshot.avgCostPerRun,
      lastUpdated: new Date(),
    },
  });
}

export async function getMonthlyCost(orgId: string, monthDate = new Date()) {
  const start = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1, 0, 0, 0));

  const events = await prisma.agentCostEvent.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
      workflow: {
        organizationId: orgId,
      },
    },
    select: {
      costUsd: true,
      workflowId: true,
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totalUsd = events.reduce((sum, event) => sum + Number(event.costUsd), 0);
  const byWorkflow = new Map<string, { workflowId: string; workflowName: string; totalUsd: number }>();

  for (const event of events) {
    const workflowId = event.workflowId ?? event.workflow?.id;
    if (!workflowId || !event.workflow) {
      continue;
    }

    const current = byWorkflow.get(workflowId) ?? {
      workflowId,
      workflowName: event.workflow.name,
      totalUsd: 0,
    };
    current.totalUsd += Number(event.costUsd);
    byWorkflow.set(workflowId, current);
  }

  return {
    monthStart: start,
    monthEnd: end,
    totalUsd,
    workflows: [...byWorkflow.values()].sort((a, b) => b.totalUsd - a.totalUsd),
  };
}
