import type { ExecutionStatus, ExecutionTrigger, LogLevel } from "@prisma/client";

export type ExecutionListItem = {
  id: string;
  organizationId: string;
  agentId: string;
  workflowId?: string | null;
  status: ExecutionStatus;
  trigger: ExecutionTrigger;
  errorMessage?: string | null;
  outputPayload?: Record<string, unknown> | null;
  createdAt: Date;
  startedAt?: Date | null;
  finishedAt?: Date | null;
};

export type ExecutionLogItem = {
  id: string;
  executionId: string;
  organizationId: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown> | null;
  occurredAt: Date;
};
