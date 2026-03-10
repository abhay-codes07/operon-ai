import { prisma } from "@/server/db/client";
import { logInfo } from "@/server/observability/logger";

type SLABreachType = "FAILURE_RATE" | "EXECUTION_TIMEOUT" | "MISSED_SCHEDULE";

export async function createIncident(input: {
  organizationId: string;
  workflowId: string;
  runId?: string;
  breachType: SLABreachType;
  breachDetails: Record<string, unknown>;
}) {
  return prisma.sLABreachIncident.create({
    data: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      runId: input.runId,
      breachType: input.breachType,
      breachDetails: input.breachDetails,
    },
  });
}

export function classifyBreachType(input: {
  failureRateExceeded?: boolean;
  timeoutExceeded?: boolean;
  scheduleMissed?: boolean;
}): SLABreachType {
  if (input.timeoutExceeded) {
    return "EXECUTION_TIMEOUT";
  }
  if (input.failureRateExceeded) {
    return "FAILURE_RATE";
  }
  return "MISSED_SCHEDULE";
}

export async function triggerNotifications(input: {
  incidentId: string;
  workflowId: string;
  slackChannel?: string | null;
  email?: string | null;
}) {
  logInfo("SLA incident notification dispatched", {
    component: "sla-incident-service",
    workflowId: input.workflowId,
    metadata: {
      incidentId: input.incidentId,
      slackChannel: input.slackChannel ?? null,
      email: input.email ?? null,
    },
  });
}

export async function resolveIncident(incidentId: string) {
  return prisma.sLABreachIncident.update({
    where: { id: incidentId },
    data: { resolvedAt: new Date() },
  });
}

export async function createSlaIncident(input: {
  organizationId: string;
  workflowId: string;
  runId?: string;
  breachType: SLABreachType;
  breachDetails: Record<string, unknown>;
}) {
  const recentBreachCount = await prisma.sLABreachIncident.count({
    where: {
      workflowId: input.workflowId,
      resolvedAt: null,
    },
  });

  const runLogs = input.runId
    ? await prisma.executionLog.findMany({
        where: {
          executionId: input.runId,
        },
        select: {
          level: true,
          message: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: "asc",
        },
        take: 20,
      })
    : [];

  const incident = await createIncident(input);

  const workflowSla = await prisma.workflowSLA.findUnique({
    where: { workflowId: input.workflowId },
    select: {
      notificationSlackChannel: true,
      notificationEmail: true,
    },
  });

  await triggerNotifications({
    incidentId: incident.id,
    workflowId: input.workflowId,
    slackChannel: workflowSla?.notificationSlackChannel,
    email: workflowSla?.notificationEmail,
  });

  await prisma.sLABreachIncident.update({
    where: { id: incident.id },
    data: {
      breachDetails: {
        ...(input.breachDetails as Record<string, unknown>),
        recentOpenBreaches: recentBreachCount,
        attachedRunLogs: runLogs.map((log) => ({
          level: log.level,
          message: log.message,
          occurredAt: log.occurredAt.toISOString(),
        })),
      },
    },
  });

  return incident;
}

export async function listIncidentsByOrganization(organizationId: string) {
  return prisma.sLABreachIncident.findMany({
    where: { organizationId },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
      run: {
        select: { id: true, status: true, createdAt: true },
      },
    },
    orderBy: { detectedAt: "desc" },
    take: 200,
  });
}
