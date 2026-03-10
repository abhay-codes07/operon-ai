import { prisma } from "@/server/db/client";

function extractDomain(target: string | null | undefined): string | null {
  if (!target) {
    return null;
  }

  try {
    return new URL(target).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export type BehaviorAnomaly = {
  type: "UNEXPECTED_DOMAIN" | "UNAUTHORIZED_ACTION" | "EMAIL_LINK_ACTION";
  reason: string;
};

export async function detectBehaviorAnomalies(input: {
  workflowId: string;
  action: string;
  target?: string | null;
}) {
  const baseline = await prisma.agentBehaviorBaseline.findUnique({
    where: { workflowId: input.workflowId },
  });

  if (!baseline) {
    return [] as BehaviorAnomaly[];
  }

  const allowedActions = Array.isArray(baseline.allowedActions)
    ? (baseline.allowedActions as string[]).map((value) => value.toLowerCase())
    : [];
  const allowedDomains = Array.isArray(baseline.allowedDomains)
    ? (baseline.allowedDomains as string[]).map((value) => value.toLowerCase())
    : [];

  const normalizedAction = input.action.trim().toLowerCase();
  const targetDomain = extractDomain(input.target);

  const anomalies: BehaviorAnomaly[] = [];

  if (allowedActions.length > 0 && !allowedActions.includes(normalizedAction)) {
    anomalies.push({
      type: "UNAUTHORIZED_ACTION",
      reason: `Action ${input.action} is outside behavior baseline`,
    });
  }

  if (targetDomain && allowedDomains.length > 0 && !allowedDomains.includes(targetDomain)) {
    anomalies.push({
      type: "UNEXPECTED_DOMAIN",
      reason: `Domain ${targetDomain} is outside behavior baseline`,
    });
  }

  if (normalizedAction.includes("email") || (input.target ?? "").toLowerCase().startsWith("mailto:")) {
    anomalies.push({
      type: "EMAIL_LINK_ACTION",
      reason: "Email action detected in agent run",
    });
  }

  return anomalies;
}

export async function pauseExecutionForBehaviorAnomaly(input: {
  executionId: string;
  anomalyReasons: string[];
}) {
  return prisma.execution.update({
    where: {
      id: input.executionId,
    },
    data: {
      isPaused: true,
      errorMessage: `Operon Shield paused execution: ${input.anomalyReasons.join("; ")}`,
    },
    select: {
      id: true,
      isPaused: true,
      errorMessage: true,
    },
  });
}
