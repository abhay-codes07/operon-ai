import { prisma } from "@/server/db/client";

export async function createShieldPolicy(input: {
  organizationId: string;
  allowedDomains: string[];
  blockedActions: string[];
}) {
  return prisma.shieldPolicy.create({
    data: {
      orgId: input.organizationId,
      allowedDomains: input.allowedDomains,
      blockedActions: input.blockedActions,
    },
  });
}

export async function listShieldPolicies(organizationId: string) {
  return prisma.shieldPolicy.findMany({
    where: {
      orgId: organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function latestShieldPolicy(organizationId: string) {
  return prisma.shieldPolicy.findFirst({
    where: {
      orgId: organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function upsertBehaviorBaseline(input: {
  workflowId: string;
  allowedActions: string[];
  allowedDomains: string[];
}) {
  return prisma.agentBehaviorBaseline.upsert({
    where: {
      workflowId: input.workflowId,
    },
    update: {
      allowedActions: input.allowedActions,
      allowedDomains: input.allowedDomains,
    },
    create: {
      workflowId: input.workflowId,
      allowedActions: input.allowedActions,
      allowedDomains: input.allowedDomains,
    },
  });
}

export async function getBehaviorBaseline(workflowId: string) {
  return prisma.agentBehaviorBaseline.findUnique({
    where: {
      workflowId,
    },
  });
}
