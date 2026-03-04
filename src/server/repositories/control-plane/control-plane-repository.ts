import { prisma } from "@/server/db/client";

export async function createExecutionStreamEvent(input: {
  organizationId: string;
  executionId: string;
  sequence: number;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  return prisma.executionStreamEvent.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      sequence: input.sequence,
      eventType: input.eventType,
      payload: input.payload,
    },
    select: {
      id: true,
      organizationId: true,
      executionId: true,
      sequence: true,
      eventType: true,
      payload: true,
      occurredAt: true,
    },
  });
}

export async function listExecutionStreamEvents(input: {
  organizationId: string;
  executionId: string;
  sinceSequence?: number;
}) {
  return prisma.executionStreamEvent.findMany({
    where: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      sequence: input.sinceSequence ? { gt: input.sinceSequence } : undefined,
    },
    orderBy: {
      sequence: "asc",
    },
    take: 500,
  });
}

export async function getLatestExecutionStreamSequence(organizationId: string, executionId: string) {
  const latest = await prisma.executionStreamEvent.findFirst({
    where: {
      organizationId,
      executionId,
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });

  return latest?.sequence ?? 0;
}

export async function createExecutionControlCommand(input: {
  organizationId: string;
  executionId: string;
  action: "PAUSE" | "RESUME" | "STEP" | "OVERRIDE_ACTION" | "STOP";
  reason?: string;
  payload?: Record<string, unknown>;
}) {
  return prisma.executionControlCommand.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      action: input.action,
      reason: input.reason,
      payload: input.payload,
    },
  });
}

export async function listPendingExecutionControlCommands(input: {
  organizationId: string;
  executionId: string;
}) {
  return prisma.executionControlCommand.findMany({
    where: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function markExecutionControlCommandApplied(commandId: string) {
  return prisma.executionControlCommand.update({
    where: {
      id: commandId,
    },
    data: {
      status: "APPLIED",
      appliedAt: new Date(),
    },
  });
}
