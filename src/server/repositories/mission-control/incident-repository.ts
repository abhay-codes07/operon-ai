import { prisma } from "@/server/db/client";

type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export async function createIncident(input: {
  organizationId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status?: IncidentStatus;
  agentId?: string;
  executionId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.incident.create({
    data: {
      organizationId: input.organizationId,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: input.status ?? "OPEN",
      agentId: input.agentId,
      executionId: input.executionId,
      metadata: input.metadata,
    },
  });
}

export async function appendIncidentEvent(input: {
  organizationId: string;
  incidentId: string;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.incidentEvent.create({
    data: {
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      eventType: input.eventType,
      message: input.message,
      metadata: input.metadata,
    },
  });
}

export async function listRecentIncidents(input: {
  organizationId: string;
  status?: IncidentStatus;
  limit?: number;
}) {
  return prisma.incident.findMany({
    where: {
      organizationId: input.organizationId,
      status: input.status,
    },
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      status: true,
      detectedAt: true,
      resolvedAt: true,
      agentId: true,
      executionId: true,
      events: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 4,
        select: {
          id: true,
          eventType: true,
          message: true,
          occurredAt: true,
        },
      },
    },
    orderBy: {
      detectedAt: "desc",
    },
    take: input.limit ?? 30,
  });
}

export async function countIncidentsInWindow(input: {
  organizationId: string;
  from: Date;
  to: Date;
}) {
  return prisma.incident.count({
    where: {
      organizationId: input.organizationId,
      detectedAt: {
        gte: input.from,
        lte: input.to,
      },
    },
  });
}

export async function markIncidentResolved(input: {
  organizationId: string;
  incidentId: string;
}) {
  return prisma.incident.updateMany({
    where: {
      id: input.incidentId,
      organizationId: input.organizationId,
      status: {
        not: "RESOLVED",
      },
    },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
}
