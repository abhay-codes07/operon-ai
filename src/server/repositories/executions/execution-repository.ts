import type { ExecutionStatus } from "@prisma/client";

import type { ExecutionListItem, ExecutionLogItem } from "@/modules/executions/contracts";
import {
  appendExecutionLogInputSchema,
  createExecutionInputSchema,
} from "@/modules/executions/schemas";
import { prisma } from "@/server/db/client";
import {
  normalizePagination,
  type PaginationInput,
  toPaginatedResult,
} from "@/server/repositories/shared/pagination";
import type { PaginatedResult } from "@/types/pagination";

type ListExecutionsInput = {
  organizationId: string;
  status?: ExecutionStatus;
  pagination?: PaginationInput;
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
      errorMessage: true,
      outputPayload: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}

export async function listExecutions(
  input: ListExecutionsInput,
): Promise<PaginatedResult<ExecutionListItem>> {
  const pagination = normalizePagination(input.pagination);
  const where = {
    organizationId: input.organizationId,
    status: input.status,
  };
  const [items, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        agentId: true,
        workflowId: true,
        status: true,
        trigger: true,
        errorMessage: true,
        outputPayload: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.execution.count({ where }),
  ]);

  return toPaginatedResult(items, total, pagination);
}

export async function appendExecutionLog(input: unknown): Promise<ExecutionLogItem> {
  const parsed = appendExecutionLogInputSchema.parse(input);

  const execution = await prisma.execution.findFirst({
    where: {
      id: parsed.executionId,
      organizationId: parsed.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!execution) {
    throw new Error("Execution not found for organization");
  }

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
      metadata: true,
      occurredAt: true,
    },
  });
}

export async function listExecutionLogs(
  organizationId: string,
  executionId: string,
  paginationInput?: PaginationInput,
): Promise<PaginatedResult<ExecutionLogItem>> {
  const pagination = normalizePagination(paginationInput);
  const where = {
    organizationId,
    executionId,
  };
  const [items, total] = await Promise.all([
    prisma.executionLog.findMany({
      where,
      select: {
        id: true,
        executionId: true,
        organizationId: true,
        level: true,
        message: true,
        metadata: true,
        occurredAt: true,
      },
      orderBy: {
        occurredAt: "asc",
      },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.executionLog.count({ where }),
  ]);

  return toPaginatedResult(items, total, pagination);
}

export async function updateExecutionStatus(
  organizationId: string,
  executionId: string,
  status: ExecutionStatus,
): Promise<ExecutionListItem> {
  const existing = await prisma.execution.findFirst({
    where: {
      id: executionId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Execution not found for organization");
  }

  return prisma.execution.update({
    where: {
      id: executionId,
    },
    data: {
      status,
      startedAt: status === "RUNNING" ? new Date() : undefined,
      finishedAt:
        status === "FAILED" || status === "SUCCEEDED" || status === "CANCELED"
          ? new Date()
          : undefined,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      status: true,
      trigger: true,
      errorMessage: true,
      outputPayload: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}

export async function getExecutionById(
  organizationId: string,
  executionId: string,
): Promise<ExecutionListItem | null> {
  return prisma.execution.findFirst({
    where: {
      organizationId,
      id: executionId,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      status: true,
      trigger: true,
      errorMessage: true,
      outputPayload: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}

export async function persistExecutionResult(input: {
  organizationId: string;
  executionId: string;
  outputPayload?: Record<string, unknown>;
  errorMessage?: string;
}) {
  const execution = await prisma.execution.findFirst({
    where: {
      id: input.executionId,
      organizationId: input.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!execution) {
    throw new Error("Execution not found for organization");
  }

  return prisma.execution.update({
    where: {
      id: input.executionId,
    },
    data: {
      outputPayload: input.outputPayload,
      errorMessage: input.errorMessage,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      status: true,
      trigger: true,
      errorMessage: true,
      outputPayload: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}

export async function prepareExecutionForRetry(input: {
  organizationId: string;
  executionId: string;
}): Promise<ExecutionListItem> {
  const execution = await prisma.execution.findFirst({
    where: {
      id: input.executionId,
      organizationId: input.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!execution) {
    throw new Error("Execution not found for organization");
  }

  return prisma.execution.update({
    where: {
      id: input.executionId,
    },
    data: {
      status: "QUEUED",
      errorMessage: null,
      outputPayload: null,
      startedAt: null,
      finishedAt: null,
      trigger: "RETRY",
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      status: true,
      trigger: true,
      errorMessage: true,
      outputPayload: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}
