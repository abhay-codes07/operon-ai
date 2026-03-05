import type { PolicyRuleType } from "@prisma/client";

import { prisma } from "@/server/db/client";

export async function getAgentPolicy(input: { organizationId: string; agentId: string }) {
  return prisma.agentPolicy.findUnique({
    where: {
      organizationId_agentId: {
        organizationId: input.organizationId,
        agentId: input.agentId,
      },
    },
    include: {
      rules: {
        where: { enabled: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export async function upsertAgentPolicy(input: {
  organizationId: string;
  agentId: string;
  enabled: boolean;
  maxRunsPerHour: number;
  allowedWindowStartHr?: number;
  allowedWindowEndHr?: number;
  timezone: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.agentPolicy.upsert({
    where: {
      organizationId_agentId: {
        organizationId: input.organizationId,
        agentId: input.agentId,
      },
    },
    create: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      enabled: input.enabled,
      maxRunsPerHour: input.maxRunsPerHour,
      allowedWindowStartHr: input.allowedWindowStartHr,
      allowedWindowEndHr: input.allowedWindowEndHr,
      timezone: input.timezone,
      metadata: input.metadata,
    },
    update: {
      enabled: input.enabled,
      maxRunsPerHour: input.maxRunsPerHour,
      allowedWindowStartHr: input.allowedWindowStartHr,
      allowedWindowEndHr: input.allowedWindowEndHr,
      timezone: input.timezone,
      metadata: input.metadata,
    },
  });
}

export async function replacePolicyRules(input: {
  organizationId: string;
  agentPolicyId: string;
  ruleType: PolicyRuleType;
  values: string[];
}) {
  await prisma.policyRule.deleteMany({
    where: {
      organizationId: input.organizationId,
      agentPolicyId: input.agentPolicyId,
      ruleType: input.ruleType,
    },
  });

  if (input.values.length === 0) {
    return;
  }

  await prisma.policyRule.createMany({
    data: input.values.map((value) => ({
      organizationId: input.organizationId,
      agentPolicyId: input.agentPolicyId,
      ruleType: input.ruleType,
      value,
      enabled: true,
    })),
    skipDuplicates: true,
  });
}

export async function listAgentPolicies(organizationId: string) {
  return prisma.agentPolicy.findMany({
    where: {
      organizationId,
    },
    include: {
      rules: {
        where: { enabled: true },
        orderBy: [{ ruleType: "asc" }, { value: "asc" }],
      },
      agent: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}
