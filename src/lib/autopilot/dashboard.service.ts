import { prisma } from "@/server/db/client";

export async function listAutopilotRepairEvents(orgId: string, limit = 100) {
  const events = await prisma.autopilotRepairEvent.findMany({
    where: {
      orgId,
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
      run: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return events.map((event) => ({
    id: event.id,
    runId: event.runId,
    occurredAt: event.createdAt,
    metadata: {
      strategy: event.strategy,
      failedSelector: event.failedSelector,
      repairedSelector: event.repairedSelector,
      confidence: event.confidence,
      success: event.success,
    },
    workflow: event.workflow ?? null,
    status: event.run?.status ?? null,
  }));
}

export async function listAutopilotSessions(input: {
  orgId: string;
  page: number;
  pageSize: number;
  status?: "RECORDING" | "REVIEW" | "APPROVED" | "COMPLETED" | "FAILED";
}) {
  const [items, total] = await Promise.all([
    prisma.autopilotSession.findMany({
      where: {
        orgId: input.orgId,
        ...(input.status ? { status: input.status } : {}),
      },
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
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.autopilotSession.count({
      where: {
        orgId: input.orgId,
        ...(input.status ? { status: input.status } : {}),
      },
    }),
  ]);

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function listAutopilotRepairEventsPage(input: {
  orgId: string;
  page: number;
  pageSize: number;
  workflowId?: string;
  runId?: string;
}) {
  const where = {
    orgId: input.orgId,
    ...(input.workflowId ? { workflowId: input.workflowId } : {}),
    ...(input.runId ? { runId: input.runId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.autopilotRepairEvent.findMany({
      where,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        run: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.autopilotRepairEvent.count({ where }),
  ]);

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getAutopilotSummary(orgId: string) {
  const [sessionTotals, memoryTotals, repairTotals] = await Promise.all([
    prisma.autopilotSession.groupBy({
      by: ["status"],
      where: { orgId },
      _count: { _all: true },
    }),
    prisma.domainMemory.aggregate({
      where: { orgId },
      _count: { _all: true },
      _avg: { reliabilityScore: true },
    }),
    prisma.autopilotRepairEvent.aggregate({
      where: { orgId },
      _count: { _all: true },
      _avg: { confidence: true },
    }),
  ]);

  return {
    sessionsByStatus: sessionTotals.map((row) => ({ status: row.status, count: row._count._all })),
    domainMemoryCount: memoryTotals._count._all,
    domainMemoryReliabilityAvg: Number(memoryTotals._avg.reliabilityScore ?? 0),
    repairEventCount: repairTotals._count._all,
    repairConfidenceAvg: Number(repairTotals._avg.confidence ?? 0),
  };
}

export async function getAutopilotSessionById(input: { orgId: string; sessionId: string }) {
  return prisma.autopilotSession.findFirst({
    where: {
      id: input.sessionId,
      orgId: input.orgId,
    },
    include: {
      actions: {
        orderBy: { timestamp: "asc" },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      repairEvents: {
        orderBy: { createdAt: "desc" },
        take: 200,
      },
    },
  });
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
