import type { SLABreachType } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { logInfo } from "@/server/observability/logger";

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
