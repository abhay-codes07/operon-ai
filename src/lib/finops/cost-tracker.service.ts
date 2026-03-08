import type { AgentCostEventType } from "@prisma/client";

import { getModelCostPerToken } from "@/lib/finops/cost-rates";
import { finopsRates } from "@/lib/finops/cost-rates";
import { prisma } from "@/server/db/client";

async function resolveExecutionCostContext(runId: string) {
  return prisma.execution.findUnique({
    where: { id: runId },
    select: {
      id: true,
      workflowId: true,
    },
  });
}

async function createCostEvent(input: {
  runId?: string;
  workflowId?: string;
  pipelineRunId?: string;
  eventType: AgentCostEventType;
  costUsd: number;
  metadata?: Record<string, unknown>;
}) {
  return prisma.agentCostEvent.create({
    data: {
      runId: input.runId,
      workflowId: input.workflowId,
      pipelineRunId: input.pipelineRunId,
      eventType: input.eventType,
      costUsd: input.costUsd,
      metadata: input.metadata,
    },
  });
}

export async function recordLLMCost(runId: string, tokens: number, model: string) {
  const context = await resolveExecutionCostContext(runId);
  if (!context) {
    return null;
  }

  const perToken = getModelCostPerToken(model);
  const costUsd = Math.max(0, tokens) * perToken;

  return createCostEvent({
    runId: context.id,
    workflowId: context.workflowId ?? undefined,
    eventType: "LLM_CALL",
    costUsd,
    metadata: { tokens, model, perToken },
  });
}

export async function recordBrowserRuntime(runId: string, seconds: number) {
  const context = await resolveExecutionCostContext(runId);
  if (!context) {
    return null;
  }

  const costUsd = Math.max(0, seconds) * finopsRates.browserRuntimePerSecondUsd;
  return createCostEvent({
    runId: context.id,
    workflowId: context.workflowId ?? undefined,
    eventType: "BROWSER_RUNTIME",
    costUsd,
    metadata: {
      seconds,
      ratePerSecondUsd: finopsRates.browserRuntimePerSecondUsd,
    },
  });
}

export async function recordRetryCost(runId: string) {
  const context = await resolveExecutionCostContext(runId);
  if (!context) {
    return null;
  }

  return createCostEvent({
    runId: context.id,
    workflowId: context.workflowId ?? undefined,
    eventType: "RETRY",
    costUsd: finopsRates.retryFlatUsd,
    metadata: {
      retryFlatUsd: finopsRates.retryFlatUsd,
    },
  });
}

export async function recordSelfHealingCost(runId: string, healedSelectors: number) {
  const context = await resolveExecutionCostContext(runId);
  if (!context) {
    return null;
  }

  const costUsd = Math.max(0, healedSelectors) * finopsRates.selfHealingFlatUsd;
  return createCostEvent({
    runId: context.id,
    workflowId: context.workflowId ?? undefined,
    eventType: "SELF_HEALING",
    costUsd,
    metadata: {
      healedSelectors,
      selfHealingFlatUsd: finopsRates.selfHealingFlatUsd,
    },
  });
}

export async function calculateRunCost(runId: string) {
  const result = await prisma.agentCostEvent.aggregate({
    where: { runId },
    _sum: {
      costUsd: true,
    },
  });

  return Number(result._sum.costUsd ?? 0);
}

export async function recordPipelineRuntimeCost(
  pipelineRunId: string,
  workflowId: string | null,
  seconds: number,
) {
  const costUsd = Math.max(0, seconds) * finopsRates.browserRuntimePerSecondUsd;
  return createCostEvent({
    pipelineRunId,
    workflowId: workflowId ?? undefined,
    eventType: "BROWSER_RUNTIME",
    costUsd,
    metadata: {
      seconds,
      source: "pipeline_orchestration_runtime",
      ratePerSecondUsd: finopsRates.browserRuntimePerSecondUsd,
    },
  });
}
