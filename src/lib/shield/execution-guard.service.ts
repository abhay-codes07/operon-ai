import { prisma } from "@/server/db/client";

function normalizeAction(action: string): string {
  return action.trim().toLowerCase();
}

function resolveDomain(target: string | null | undefined): string | null {
  if (!target) {
    return null;
  }
  try {
    return new URL(target).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export type ExecutionGuardDecision = {
  allowed: boolean;
  reasons: string[];
  blockedByPolicy: boolean;
};

export async function guardExecutionAction(input: {
  organizationId: string;
  workflowId: string;
  action: string;
  target?: string | null;
}): Promise<ExecutionGuardDecision> {
  const [policy, baseline] = await Promise.all([
    prisma.shieldPolicy.findFirst({
      where: { orgId: input.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentBehaviorBaseline.findUnique({
      where: { workflowId: input.workflowId },
    }),
  ]);

  const reasons: string[] = [];
  const action = normalizeAction(input.action);
  const targetDomain = resolveDomain(input.target);

  if (policy) {
    const blockedActions = Array.isArray(policy.blockedActions)
      ? (policy.blockedActions as string[]).map((item) => item.toLowerCase())
      : [];
    const allowedDomains = Array.isArray(policy.allowedDomains)
      ? (policy.allowedDomains as string[]).map((item) => item.toLowerCase())
      : [];

    if (blockedActions.includes(action)) {
      reasons.push(`Action ${input.action} blocked by Shield policy`);
    }

    if (targetDomain && allowedDomains.length > 0 && !allowedDomains.includes(targetDomain)) {
      reasons.push(`Domain ${targetDomain} blocked by Shield policy`);
    }
  }

  if (baseline) {
    const allowedActions = Array.isArray(baseline.allowedActions)
      ? (baseline.allowedActions as string[]).map((item) => item.toLowerCase())
      : [];

    if (allowedActions.length > 0 && !allowedActions.includes(action)) {
      reasons.push(`Action ${input.action} not allowed by behavior baseline`);
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    blockedByPolicy: reasons.some((reason) => reason.includes("Shield policy")),
  };
}
