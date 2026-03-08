import type { AgentCostEventType } from "@prisma/client";

import { getModelCostPerToken } from "@/lib/finops/cost-rates";
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
