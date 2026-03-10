import type { ShieldSeverity } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { appendExecutionEvent } from "@/server/services/executions/execution-service";
import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";

function toSeverity(riskScore: number): ShieldSeverity {
  if (riskScore >= 80) {
    return "CRITICAL";
  }
  if (riskScore >= 60) {
    return "HIGH";
  }
  if (riskScore >= 30) {
    return "MEDIUM";
  }
  return "LOW";
}

export async function logPromptInjectionEvent(input: {
  organizationId: string;
  workflowId: string;
  runId: string;
  url: string;
  domLocation?: string | null;
  injectedText: string;
  riskScore: number;
}) {
  const event = await prisma.promptInjectionEvent.create({
    data: {
      orgId: input.organizationId,
      workflowId: input.workflowId,
      runId: input.runId,
      url: input.url,
      domLocation: input.domLocation ?? null,
      injectedText: input.injectedText,
      riskScore: input.riskScore,
      severity: toSeverity(input.riskScore),
    },
  });

  await appendExecutionEvent({
    organizationId: input.organizationId,
    executionId: input.runId,
    level: "WARN",
    message: "Operon Shield detected prompt injection pattern",
    metadata: {
      promptInjectionEventId: event.id,
      url: input.url,
      severity: event.severity,
      riskScore: input.riskScore,
    },
  });

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.runId,
    eventType: "shield.prompt_injection",
    payload: {
      eventId: event.id,
      severity: event.severity,
      riskScore: input.riskScore,
      url: input.url,
    },
  }).catch(() => null);

  return event;
}

export async function logBehaviorAnomalyEvent(input: {
  organizationId: string;
  runId: string;
  reasons: string[];
}) {
  await appendExecutionEvent({
    organizationId: input.organizationId,
    executionId: input.runId,
    level: "WARN",
    message: "Operon Shield behavioral anomaly detected",
    metadata: {
      reasons: input.reasons,
    },
  });

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.runId,
    eventType: "shield.behavior_anomaly",
    payload: {
      reasons: input.reasons,
    },
  }).catch(() => null);
}

export async function logShieldPolicyViolation(input: {
  organizationId: string;
  runId: string;
  reasons: string[];
}) {
  await appendExecutionEvent({
    organizationId: input.organizationId,
    executionId: input.runId,
    level: "ERROR",
    message: "Operon Shield blocked execution step",
    metadata: {
      reasons: input.reasons,
    },
  });

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.runId,
    eventType: "shield.policy_violation",
    payload: {
      reasons: input.reasons,
    },
  }).catch(() => null);
}

export async function listShieldEvents(input: {
  organizationId: string;
  limit?: number;
}) {
  return prisma.promptInjectionEvent.findMany({
    where: {
      orgId: input.organizationId,
    },
    take: input.limit ?? 100,
    orderBy: {
      detectedAt: "desc",
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
          createdAt: true,
        },
      },
    },
  });
}
