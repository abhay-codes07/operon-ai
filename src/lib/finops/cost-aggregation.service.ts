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
