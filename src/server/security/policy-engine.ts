import { organizationPolicySchema } from "@/modules/security/schemas";
import {
  getOrganizationPolicy,
  upsertOrganizationPolicy,
} from "@/server/repositories/security/policy-repository";

type WorkflowLikeStep = {
  action?: string;
  target?: string;
};

function extractDomain(target?: string) {
  if (!target) {
    return null;
  }

  try {
    const value = new URL(target);
    return value.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isWithinAllowedWindow(
  nowHour: number,
  startHour?: number,
  endHour?: number,
) {
  if (startHour === undefined || endHour === undefined) {
    return true;
  }

  if (startHour <= endHour) {
    return nowHour >= startHour && nowHour <= endHour;
  }

  return nowHour >= startHour || nowHour <= endHour;
}

export async function evaluateWorkflowAgainstPolicy(input: {
  organizationId: string;
  workflowId: string;
  definition: { steps?: WorkflowLikeStep[] } | null;
}) {
  const policy = await getOrganizationPolicy(input.organizationId);
  if (!policy) {
    return { allowed: true as const, reasons: [] as string[] };
  }

  const reasons: string[] = [];
  const steps = input.definition?.steps ?? [];
  const restrictedActionSet = new Set(policy.restrictedActions.map((item) => item.toLowerCase()));

  for (const step of steps) {
    if (step.action && restrictedActionSet.has(step.action.toLowerCase())) {
      reasons.push(`Restricted action in policy: ${step.action}`);
    }

    const domain = extractDomain(step.target);
    if (domain && policy.domainAllowlist.length > 0 && !policy.domainAllowlist.includes(domain)) {
      reasons.push(`Domain is not allowlisted: ${domain}`);
    }

    if (policy.requireHttps && step.target?.startsWith("http://")) {
      reasons.push(`HTTP target blocked by policy: ${step.target}`);
    }
  }

  const nowHour = new Date().getUTCHours();
  if (!isWithinAllowedWindow(nowHour, policy.allowedWindowStartHr, policy.allowedWindowEndHr)) {
    reasons.push("Execution is outside organization policy window");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  } as const;
}

export async function fetchOrganizationPolicy(organizationId: string) {
  return getOrganizationPolicy(organizationId);
}

export async function saveOrganizationPolicy(input: {
  organizationId: string;
  policy: unknown;
}) {
  const parsed = organizationPolicySchema.parse(input.policy);
  await upsertOrganizationPolicy(input.organizationId, parsed);
  return parsed;
}
