import { prisma } from "@/server/db/client";

export async function upsertExecutionMetric(input: {
  organizationId: string;
  executionId: string;
  agentId: string;
  durationMs: number;
  retriesUsed: number;
  isSuccess: boolean;
  failureCategory?: "SELECTOR_DRIFT" | "NAVIGATION_FAILURE" | "AUTHENTICATION_ISSUE" | "PAGE_LOAD_TIMEOUT" | "UNKNOWN";
}) {
  return prisma.executionMetric.upsert({
    where: {
      executionId: input.executionId,
    },
    update: {
      durationMs: input.durationMs,
      retriesUsed: input.retriesUsed,
      isSuccess: input.isSuccess,
      failureCategory: input.failureCategory,
    },
    create: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      agentId: input.agentId,
      durationMs: input.durationMs,
      retriesUsed: input.retriesUsed,
      isSuccess: input.isSuccess,
      failureCategory: input.failureCategory,
    },
  });
}

export async function aggregateAgentMetrics(input: { organizationId: string; agentId: string }) {
  const metrics = await prisma.executionMetric.findMany({
    where: {
      organizationId: input.organizationId,
      agentId: input.agentId,
    },
    select: {
      durationMs: true,
      retriesUsed: true,
      isSuccess: true,
    },
  });

  const total = metrics.length;
  const successes = metrics.filter((item) => item.isSuccess).length;
  const failures = total - successes;
  const retries = metrics.filter((item) => item.retriesUsed > 0).length;
  const avgExecutionMs =
    total === 0 ? 0 : Math.round(metrics.reduce((sum, item) => sum + item.durationMs, 0) / total);

  return {
    total,
    successes,
    failures,
    retries,
    avgExecutionMs,
  };
}

export async function upsertAgentReliability(input: {
  organizationId: string;
  agentId: string;
  successRate: number;
  retryRate: number;
  failureFrequency: number;
  avgExecutionMs: number;
  reliabilityScore: number;
  totalExecutions: number;
}) {
  return prisma.agentReliability.upsert({
    where: { agentId: input.agentId },
    update: {
      successRate: input.successRate,
      retryRate: input.retryRate,
      failureFrequency: input.failureFrequency,
      avgExecutionMs: input.avgExecutionMs,
      reliabilityScore: input.reliabilityScore,
      totalExecutions: input.totalExecutions,
    },
    create: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      successRate: input.successRate,
      retryRate: input.retryRate,
      failureFrequency: input.failureFrequency,
      avgExecutionMs: input.avgExecutionMs,
      reliabilityScore: input.reliabilityScore,
      totalExecutions: input.totalExecutions,
    },
    select: {
      id: true,
      agentId: true,
      successRate: true,
      retryRate: true,
      failureFrequency: true,
      avgExecutionMs: true,
      reliabilityScore: true,
      totalExecutions: true,
      updatedAt: true,
    },
  });
}

export async function listAgentReliability(organizationId: string) {
  return prisma.agentReliability.findMany({
    where: { organizationId },
    select: {
      id: true,
      agentId: true,
      successRate: true,
      retryRate: true,
      failureFrequency: true,
      avgExecutionMs: true,
      reliabilityScore: true,
      totalExecutions: true,
      updatedAt: true,
    },
    orderBy: {
      reliabilityScore: "desc",
    },
  });
}
