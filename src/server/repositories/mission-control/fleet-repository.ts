import type { FleetStatus, HealthStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

export async function appendAgentStatusSnapshot(input: {
  organizationId: string;
  agentId: string;
  status: FleetStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.agentStatusSnapshot.create({
    data: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      status: input.status,
      reason: input.reason,
      metadata: input.metadata,
    },
  });
}

export async function appendAgentHealthRecord(input: {
  organizationId: string;
  agentId: string;
  status: HealthStatus;
  cpuLoadPct?: number;
  memoryUsageMb?: number;
  queueBacklog?: number;
  successRateWindow?: number;
}) {
  return prisma.agentHealth.create({
    data: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      status: input.status,
      cpuLoadPct: input.cpuLoadPct,
      memoryUsageMb: input.memoryUsageMb,
      queueBacklog: input.queueBacklog,
      successRateWindow: input.successRateWindow,
    },
  });
}

export async function listFleetSnapshot(organizationId: string) {
  const agents = await prisma.agent.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      statusHistory: {
        orderBy: { occurredAt: "desc" },
        take: 1,
        select: {
          status: true,
          reason: true,
          occurredAt: true,
        },
      },
      healthHistory: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        select: {
          status: true,
          cpuLoadPct: true,
          memoryUsageMb: true,
          queueBacklog: true,
          successRateWindow: true,
          recordedAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    updatedAt: agent.updatedAt,
    status: agent.statusHistory[0]?.status ?? "IDLE",
    statusReason: agent.statusHistory[0]?.reason ?? null,
    statusAt: agent.statusHistory[0]?.occurredAt ?? agent.updatedAt,
    healthStatus: agent.healthHistory[0]?.status ?? "HEALTHY",
    health: agent.healthHistory[0] ?? null,
  }));
}

export async function aggregateFleetStatusCounts(organizationId: string) {
  const statuses = await prisma.agentStatusSnapshot.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: {
      _all: true,
    },
  });

  return {
    RUNNING: statuses.find((item) => item.status === "RUNNING")?._count._all ?? 0,
    IDLE: statuses.find((item) => item.status === "IDLE")?._count._all ?? 0,
    FAILED: statuses.find((item) => item.status === "FAILED")?._count._all ?? 0,
    RETRYING: statuses.find((item) => item.status === "RETRYING")?._count._all ?? 0,
  };
}
