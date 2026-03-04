import { prisma } from "@/server/db/client";

export async function createDebugSession(input: {
  organizationId: string;
  executionId: string;
  userId?: string;
  notes?: string;
}) {
  return prisma.debugSession.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      userId: input.userId,
      notes: input.notes,
    },
  });
}

export async function updateDebugSessionPatch(input: {
  debugSessionId: string;
  selectorPatch: Record<string, unknown>;
}) {
  return prisma.debugSession.update({
    where: {
      id: input.debugSessionId,
    },
    data: {
      selectorPatch: input.selectorPatch,
    },
  });
}

export async function closeDebugSession(debugSessionId: string) {
  return prisma.debugSession.update({
    where: {
      id: debugSessionId,
    },
    data: {
      active: false,
    },
  });
}

export async function listActiveDebugSessions(input: { organizationId: string; executionId?: string }) {
  return prisma.debugSession.findMany({
    where: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      active: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}
