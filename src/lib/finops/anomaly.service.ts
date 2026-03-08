import { calculateRunCost } from "@/lib/finops/cost-tracker.service";
import { prisma } from "@/server/db/client";

export async function detectRunCostAnomaly(runId: string) {
  const run = await prisma.execution.findUnique({
    where: { id: runId },
    select: {
      id: true,
      workflowId: true,
    },
  });
  if (!run?.workflowId) {
    return null;
  }

  const [runCost, summary] = await Promise.all([
    calculateRunCost(run.id),
    prisma.workflowCostSummary.findUnique({
      where: { workflowId: run.workflowId },
      select: { avgCostPerRun: true },
    }),
  ]);

  const expected = Number(summary?.avgCostPerRun ?? 0);
  if (expected <= 0 || runCost <= expected * 3) {
    return null;
  }

  const anomalyFactor = runCost / expected;
  return prisma.costAnomaly.create({
    data: {
      workflowId: run.workflowId,
      runId: run.id,
      expectedCost: expected,
      actualCost: runCost,
      anomalyFactor,
      reason: `Run cost ${runCost.toFixed(4)} exceeded baseline ${expected.toFixed(4)} by ${anomalyFactor.toFixed(2)}x`,
    },
  });
}

export async function listCostAnomalies(orgId: string) {
  return prisma.costAnomaly.findMany({
    where: {
      workflow: {
        organizationId: orgId,
      },
    },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
      run: {
        select: { id: true, status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
