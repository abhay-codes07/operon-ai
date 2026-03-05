import type { RunbookExecutionStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

export async function listRunbooks(input: { organizationId: string; enabledOnly?: boolean }) {
  return prisma.runbook.findMany({
    where: {
      organizationId: input.organizationId,
      enabled: input.enabledOnly ? true : undefined,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function createRunbook(input: {
  organizationId: string;
  name: string;
  description: string;
  triggerType: string;
  steps: Array<{ action: string; config?: Record<string, unknown> }>;
}) {
  return prisma.runbook.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      triggerType: input.triggerType,
      steps: input.steps,
    },
  });
}

export async function createRunbookExecution(input: {
  organizationId: string;
  runbookId: string;
  triggerSource: string;
  agentId?: string;
  executionId?: string;
  status?: RunbookExecutionStatus;
}) {
  return prisma.runbookExecution.create({
    data: {
      organizationId: input.organizationId,
      runbookId: input.runbookId,
      triggerSource: input.triggerSource,
      agentId: input.agentId,
      executionId: input.executionId,
      status: input.status ?? "QUEUED",
    },
  });
}

export async function updateRunbookExecution(input: {
  organizationId: string;
  runbookExecutionId: string;
  status: RunbookExecutionStatus;
  logs?: Array<{ level: "INFO" | "WARN" | "ERROR"; message: string; at: string }>;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}) {
  return prisma.runbookExecution.updateMany({
    where: {
      id: input.runbookExecutionId,
      organizationId: input.organizationId,
    },
    data: {
      status: input.status,
      logs: input.logs,
      startedAt: input.startedAt === undefined ? undefined : input.startedAt,
      finishedAt: input.finishedAt === undefined ? undefined : input.finishedAt,
    },
  });
}

export async function listRunbookExecutions(input: {
  organizationId: string;
  runbookId?: string;
  limit?: number;
}) {
  return prisma.runbookExecution.findMany({
    where: {
      organizationId: input.organizationId,
      runbookId: input.runbookId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit ?? 30,
    include: {
      runbook: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
