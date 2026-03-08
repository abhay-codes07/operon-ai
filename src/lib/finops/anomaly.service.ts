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

export async function detectOrganizationCostAnomalies(orgId: string) {
  const recentRuns = await prisma.execution.findMany({
    where: {
      organizationId: orgId,
      workflowId: { not: null },
      status: { in: ["SUCCEEDED", "FAILED", "CANCELED"] },
      finishedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    select: { id: true },
    orderBy: { finishedAt: "desc" },
    take: 200,
  });

  const anomalies = [] as Awaited<ReturnType<typeof detectRunCostAnomaly>>[];
  for (const run of recentRuns) {
    anomalies.push(await detectRunCostAnomaly(run.id));
  }

  return anomalies.filter(Boolean);
}
