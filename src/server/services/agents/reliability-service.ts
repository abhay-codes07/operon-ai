import {
  aggregateAgentMetrics,
  listAgentReliability,
  upsertAgentReliability,
  upsertExecutionMetric,
} from "@/server/repositories/agents/reliability-repository";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeReliabilityScore(input: {
  successRate: number;
  retryRate: number;
  failureFrequency: number;
  avgExecutionMs: number;
}) {
  const latencyPenalty = clamp(input.avgExecutionMs / 120_000, 0, 1);
  const score =
    input.successRate * 0.6 + (1 - input.retryRate) * 0.2 + (1 - input.failureFrequency) * 0.15 + (1 - latencyPenalty) * 0.05;

  return Number((clamp(score, 0, 1) * 100).toFixed(2));
}

export async function recordExecutionReliabilityMetric(input: {
  organizationId: string;
  executionId: string;
  agentId: string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  isSuccess: boolean;
  retriesUsed: number;
  failureCategory?: "SELECTOR_DRIFT" | "NAVIGATION_FAILURE" | "AUTHENTICATION_ISSUE" | "PAGE_LOAD_TIMEOUT" | "UNKNOWN";
}) {
  const durationMs =
    input.startedAt && input.finishedAt
      ? Math.max(0, input.finishedAt.getTime() - input.startedAt.getTime())
      : 0;

  await upsertExecutionMetric({
    organizationId: input.organizationId,
    executionId: input.executionId,
    agentId: input.agentId,
    durationMs,
    retriesUsed: input.retriesUsed,
    isSuccess: input.isSuccess,
    failureCategory: input.failureCategory,
  });

  const aggregate = await aggregateAgentMetrics({
    organizationId: input.organizationId,
    agentId: input.agentId,
  });

  const successRate = aggregate.total === 0 ? 0 : aggregate.successes / aggregate.total;
  const retryRate = aggregate.total === 0 ? 0 : aggregate.retries / aggregate.total;
  const failureFrequency = aggregate.total === 0 ? 0 : aggregate.failures / aggregate.total;
  const reliabilityScore = computeReliabilityScore({
    successRate,
    retryRate,
    failureFrequency,
    avgExecutionMs: aggregate.avgExecutionMs,
  });

  return upsertAgentReliability({
    organizationId: input.organizationId,
    agentId: input.agentId,
    successRate,
    retryRate,
    failureFrequency,
    avgExecutionMs: aggregate.avgExecutionMs,
    reliabilityScore,
    totalExecutions: aggregate.total,
  });
}

export async function fetchReliabilityDashboard(organizationId: string) {
  return listAgentReliability(organizationId);
}
