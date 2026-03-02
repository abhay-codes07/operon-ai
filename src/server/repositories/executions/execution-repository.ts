import type { ExecutionStatus } from "@prisma/client";

import type { ExecutionListItem, ExecutionLogItem } from "@/modules/executions/contracts";
import {
  appendExecutionLogInputSchema,
  createExecutionInputSchema,
} from "@/modules/executions/schemas";
import { prisma } from "@/server/db/client";

type ListExecutionsInput = {
  organizationId: string;
  status?: ExecutionStatus;
  limit?: number;
};

export async function createExecution(input: unknown): Promise<ExecutionListItem> {
  const parsed = createExecutionInputSchema.parse(input);

  return prisma.execution.create({
    data: {
      organizationId: parsed.organizationId,
      agentId: parsed.agentId,
      workflowId: parsed.workflowId,
      requestedById: parsed.requestedById,
      trigger: parsed.trigger,
      inputPayload: parsed.inputPayload,
      status: "QUEUED",
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      status: true,
      trigger: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}

export async function listExecutions(input: ListExecutionsInput): Promise<ExecutionListItem[]> {
  return prisma.execution.findMany({
    where: {
      organizationId: input.organizationId,
      status: input.status,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      status: true,
      trigger: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit ?? 100,
  });
}

export async function appendExecutionLog(input: unknown): Promise<ExecutionLogItem> {
  const parsed = appendExecutionLogInputSchema.parse(input);

  return prisma.executionLog.create({
    data: {
      executionId: parsed.executionId,
      organizationId: parsed.organizationId,
      level: parsed.level,
      message: parsed.message,
      metadata: parsed.metadata,
    },
    select: {
      id: true,
      executionId: true,
      organizationId: true,
      level: true,
      message: true,
      occurredAt: true,
    },
  });
}

export async function listExecutionLogs(
  organizationId: string,
  executionId: string,
  limit = 200,
): Promise<ExecutionLogItem[]> {
  return prisma.executionLog.findMany({
    where: {
      organizationId,
      executionId,
    },
    select: {
      id: true,
      executionId: true,
      organizationId: true,
      level: true,
      message: true,
      occurredAt: true,
    },
    orderBy: {
      occurredAt: "asc",
    },
    take: limit,
  });
}
