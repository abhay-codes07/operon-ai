import { prisma } from "@/server/db/client";

export async function listAutopilotRepairEvents(orgId: string, limit = 100) {
  const logs = await prisma.executionLog.findMany({
    where: {
      organizationId: orgId,
      message: "Autopilot selector repaired",
    },
    select: {
      id: true,
      executionId: true,
      occurredAt: true,
      metadata: true,
      execution: {
        select: {
          id: true,
          status: true,
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    runId: log.executionId,
    occurredAt: log.occurredAt,
    metadata: log.metadata,
    workflow: log.execution?.workflow ?? null,
    status: log.execution?.status ?? null,
  }));
}

export async function listRecentAutopilotSessions(orgId: string, limit = 25) {
  return prisma.autopilotSession.findMany({
    where: { orgId },
    include: {
      actions: {
        select: {
          id: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function listDomainMemories(orgId: string, limit = 50) {
  return prisma.domainMemory.findMany({
    where: { orgId },
    orderBy: [{ reliabilityScore: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });
}
