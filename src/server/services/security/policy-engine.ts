import { getAgentPolicy } from "@/server/repositories/security/agent-policy-repository";
import { countRecentAgentAudits } from "@/server/repositories/security/audit-repository";

function extractDomain(target?: string) {
  if (!target) {
    return null;
  }

  try {
    return new URL(target).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isWithinAllowedWindow(
  nowHour: number,
  startHour?: number | null,
  endHour?: number | null,
) {
  if (startHour === null || endHour === null || startHour === undefined || endHour === undefined) {
    return true;
  }

  if (startHour <= endHour) {
    return nowHour >= startHour && nowHour <= endHour;
  }

  return nowHour >= startHour || nowHour <= endHour;
}

export async function evaluateAgentPolicy(input: {
  organizationId: string;
  agentId: string;
  action: string;
  target?: string;
  requestedAt?: Date;
}) {
  const policy = await getAgentPolicy({
    organizationId: input.organizationId,
    agentId: input.agentId,
  });

  if (!policy || !policy.enabled) {
    return {
      allowed: true,
      reasons: [] as string[],
      policy: null,
      targetDomain: extractDomain(input.target),
    };
  }

  const reasons: string[] = [];
  const targetDomain = extractDomain(input.target);
  const actionValue = input.action.toLowerCase();
  const now = input.requestedAt ?? new Date();
  const nowHour = now.getUTCHours();

  const domainAllowlist = policy.rules
    .filter((rule) => rule.ruleType === "DOMAIN_ALLOWLIST")
    .map((rule) => rule.value.toLowerCase());
  const actionAllowlist = policy.rules
    .filter((rule) => rule.ruleType === "ACTION_ALLOWLIST")
    .map((rule) => rule.value.toLowerCase());

  if (domainAllowlist.length > 0 && targetDomain && !domainAllowlist.includes(targetDomain)) {
    reasons.push(`Domain not allowlisted: ${targetDomain}`);
  }

  if (actionAllowlist.length > 0 && !actionAllowlist.includes(actionValue)) {
    reasons.push(`Action not allowlisted: ${input.action}`);
  }

  if (!isWithinAllowedWindow(nowHour, policy.allowedWindowStartHr, policy.allowedWindowEndHr)) {
    reasons.push("Execution outside allowed policy window");
  }

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recentAuditCount = await countRecentAgentAudits({
    organizationId: input.organizationId,
    agentId: input.agentId,
    from: oneHourAgo,
  });
  if (recentAuditCount >= policy.maxRunsPerHour) {
    reasons.push(`Max runs per hour exceeded (${policy.maxRunsPerHour})`);
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    policy: {
      id: policy.id,
      maxRunsPerHour: policy.maxRunsPerHour,
      timezone: policy.timezone,
    },
    targetDomain,
  };
}
