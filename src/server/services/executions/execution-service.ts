import type { ExecutionStatus, ExecutionTrigger, LogLevel } from "@prisma/client";

import {
  appendExecutionLog,
  createExecution,
  listExecutionLogs,
  listExecutions,
  updateExecutionStatus,
} from "@/server/repositories/executions/execution-repository";

export async function queueExecution(input: {
  organizationId: string;
  agentId: string;
  workflowId?: string;
  requestedById?: string;
  trigger?: ExecutionTrigger;
  inputPayload?: Record<string, unknown>;
}) {
  return createExecution(input);
}

export async function fetchExecutionHistory(input: {
  organizationId: string;
  status?: ExecutionStatus;
  page?: number;
  pageSize?: number;
}) {
  return listExecutions({
    organizationId: input.organizationId,
    status: input.status,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
    },
  });
}

export async function setExecutionStatus(input: {
  organizationId: string;
  executionId: string;
  status: ExecutionStatus;
}) {
  return updateExecutionStatus(input.organizationId, input.executionId, input.status);
}

export async function appendExecutionEvent(input: {
  organizationId: string;
  executionId: string;
  level?: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return appendExecutionLog({
    organizationId: input.organizationId,
    executionId: input.executionId,
    level: input.level,
    message: input.message,
    metadata: input.metadata,
  });
}

export async function fetchExecutionTimeline(input: {
  organizationId: string;
  executionId: string;
  page?: number;
  pageSize?: number;
}) {
  return listExecutionLogs(input.organizationId, input.executionId, {
    page: input.page,
    pageSize: input.pageSize,
  });
}
