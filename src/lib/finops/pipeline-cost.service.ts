import { prisma } from "@/server/db/client";

export async function getPipelineRunCost(pipelineRunId: string) {
  const direct = await prisma.agentCostEvent.aggregate({
    where: { pipelineRunId },
    _sum: { costUsd: true },
  });

  const stepRunExecutions = await prisma.pipelineStepRun.findMany({
    where: {
      pipelineRunId,
      agentRunId: { not: null },
    },
    select: { agentRunId: true },
  });
  const runIds = stepRunExecutions
    .map((item) => item.agentRunId)
    .filter((id): id is string => typeof id === "string");
  const stepCosts = runIds.length
    ? await prisma.agentCostEvent.aggregate({
        where: { runId: { in: runIds } },
        _sum: { costUsd: true },
      })
    : { _sum: { costUsd: 0 } };

  return Number(direct._sum.costUsd ?? 0) + Number(stepCosts._sum.costUsd ?? 0);
}

export async function getPipelineCostBreakdown(pipelineRunId: string) {
  const stepRuns = await prisma.pipelineStepRun.findMany({
    where: { pipelineRunId },
    include: {
      step: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const items = [] as Array<{
    stepRunId: string;
    stepOrder: number;
    status: string;
    totalCostUsd: number;
  }>;

  for (const stepRun of stepRuns) {
    const aggregate = stepRun.agentRunId
      ? await prisma.agentCostEvent.aggregate({
          where: { runId: stepRun.agentRunId },
          _sum: { costUsd: true },
        })
      : { _sum: { costUsd: 0 } };

    items.push({
      stepRunId: stepRun.id,
      stepOrder: stepRun.step.stepOrder,
      status: stepRun.status,
      totalCostUsd: Number(aggregate._sum.costUsd ?? 0),
    });
  }

  const totalCostUsd = items.reduce((sum, item) => sum + item.totalCostUsd, 0);
  return { totalCostUsd, items };
}
