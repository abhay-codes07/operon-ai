import { secureAgentPolicySchema } from "@/modules/security/schemas";
import {
  getAgentPolicy,
  listAgentPolicies,
  replacePolicyRules,
  upsertAgentPolicy,
} from "@/server/repositories/security/agent-policy-repository";

export async function fetchAgentPolicies(organizationId: string) {
  return listAgentPolicies(organizationId);
}

export async function fetchAgentPolicy(input: { organizationId: string; agentId: string }) {
  return getAgentPolicy(input);
}

export async function saveAgentPolicy(input: {
  organizationId: string;
  agentId: string;
  policy: unknown;
}) {
  const parsed = secureAgentPolicySchema.parse(input.policy);
  const policy = await upsertAgentPolicy({
    organizationId: input.organizationId,
    agentId: input.agentId,
    enabled: parsed.enabled,
    maxRunsPerHour: parsed.maxRunsPerHour,
    allowedWindowStartHr: parsed.allowedWindowStartHr,
    allowedWindowEndHr: parsed.allowedWindowEndHr,
    timezone: parsed.timezone,
    metadata: parsed.metadata,
  });

  await replacePolicyRules({
    organizationId: input.organizationId,
    agentPolicyId: policy.id,
    ruleType: "DOMAIN_ALLOWLIST",
    values: parsed.domainAllowlist.map((item) => item.toLowerCase()),
  });
  await replacePolicyRules({
    organizationId: input.organizationId,
    agentPolicyId: policy.id,
    ruleType: "ACTION_ALLOWLIST",
    values: parsed.actionAllowlist.map((item) => item.toLowerCase()),
  });

  return getAgentPolicy({
    organizationId: input.organizationId,
    agentId: input.agentId,
  });
}
