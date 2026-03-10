import {
  appendIncidentEvent,
  countIncidentsInWindow,
  createIncident,
  listRecentIncidents,
  markIncidentResolved,
} from "@/server/repositories/mission-control/incident-repository";

type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type IncidentSignal = {
  organizationId: string;
  signalType: "FAILURE_SPIKE" | "SELECTOR_ERROR_LOOP" | "RETRY_LOOP";
  title: string;
  description: string;
  severity: IncidentSeverity;
  agentId?: string;
  executionId?: string;
  metadata?: Record<string, unknown>;
};

export async function detectIncident(input: IncidentSignal) {
  const incident = await createIncident({
    organizationId: input.organizationId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    agentId: input.agentId,
    executionId: input.executionId,
    metadata: {
      signalType: input.signalType,
      ...input.metadata,
    },
  });

  await appendIncidentEvent({
    organizationId: input.organizationId,
    incidentId: incident.id,
    eventType: "detected",
    message: `${input.signalType} detected`,
    metadata: {
      severity: input.severity,
      agentId: input.agentId ?? null,
      executionId: input.executionId ?? null,
    },
  });

  return incident;
}

export async function fetchIncidentAlerts(organizationId: string) {
  return listRecentIncidents({
    organizationId,
    limit: 40,
  });
}

export async function resolveIncident(input: { organizationId: string; incidentId: string }) {
  await markIncidentResolved(input);
  await appendIncidentEvent({
    organizationId: input.organizationId,
    incidentId: input.incidentId,
    eventType: "resolved",
    message: "Incident resolved by operator action",
  });
}

export async function fetchIncidentCountForWindow(input: {
  organizationId: string;
  from: Date;
  to: Date;
}) {
  return countIncidentsInWindow(input);
}

export async function detectExecutionAnomalies(input: {
  organizationId: string;
  executionId: string;
  agentId: string;
  logs: Array<{ message: string }>;
  executionStatus: "SUCCEEDED" | "FAILED" | "CANCELED" | "RUNNING" | "QUEUED";
}) {
  const joined = input.logs.map((log) => log.message.toLowerCase()).join("\n");
  const incidents = [] as Array<{
    id: string;
    signalType: "FAILURE_SPIKE" | "SELECTOR_ERROR_LOOP" | "RETRY_LOOP";
  }>;

  if (input.executionStatus === "FAILED") {
    const incident = await detectIncident({
      organizationId: input.organizationId,
      signalType: "FAILURE_SPIKE",
      title: "Execution failure spike",
      description: "Execution ended in failed state; failure threshold crossed.",
      severity: "HIGH",
      executionId: input.executionId,
      agentId: input.agentId,
    });
    incidents.push({ id: incident.id, signalType: "FAILURE_SPIKE" });
  }

  const selectorErrorMentions = (joined.match(/selector/g) ?? []).length;
  if (selectorErrorMentions >= 2) {
    const incident = await detectIncident({
      organizationId: input.organizationId,
      signalType: "SELECTOR_ERROR_LOOP",
      title: "Repeated selector errors",
      description: "Multiple selector failures detected in a single execution.",
      severity: "MEDIUM",
      executionId: input.executionId,
      agentId: input.agentId,
      metadata: {
        selectorErrorMentions,
      },
    });
    incidents.push({ id: incident.id, signalType: "SELECTOR_ERROR_LOOP" });
  }

  const retryMentions = (joined.match(/retry/g) ?? []).length;
  if (retryMentions >= 2) {
    const incident = await detectIncident({
      organizationId: input.organizationId,
      signalType: "RETRY_LOOP",
      title: "Retry loop detected",
      description: "Execution logs indicate repeated retries.",
      severity: "MEDIUM",
      executionId: input.executionId,
      agentId: input.agentId,
      metadata: {
        retryMentions,
      },
    });
    incidents.push({ id: incident.id, signalType: "RETRY_LOOP" });
  }

  return incidents;
}
