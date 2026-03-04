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

export type ExecutionStepItem = {
  id: string;
  executionId: string;
  organizationId: string;
  stepIndex: number;
  stepKey: string;
  action: string;
  target?: string | null;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
  metadata?: Record<string, unknown> | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
};

export type DomSnapshotItem = {
  id: string;
  executionId: string;
  executionStepId?: string | null;
  organizationId: string;
  pageUrl?: string | null;
  domHtml: string;
  metadata?: Record<string, unknown> | null;
  capturedAt: Date;
};

export type SelfHealingRecordItem = {
  id: string;
  executionId: string;
  executionStepId?: string | null;
  organizationId: string;
  originalSelector?: string | null;
  resolvedSelector: string;
  strategy: string;
  similarityScore: number;
  success: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};
