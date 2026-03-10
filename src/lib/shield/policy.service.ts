import { prisma } from "@/server/db/client";

function normalizeDomains(domains: string[]) {
  return [...new Set(domains.map((domain) => domain.trim().toLowerCase()).filter(Boolean))];
}

function normalizeActions(actions: string[]) {
  return [...new Set(actions.map((action) => action.trim().toLowerCase()).filter(Boolean))];
}

export async function createShieldPolicy(input: {
  organizationId: string;
  allowedDomains: string[];
  blockedActions: string[];
}) {
  const allowedDomains = normalizeDomains(input.allowedDomains);
  const blockedActions = normalizeActions(input.blockedActions);
  return prisma.shieldPolicy.create({
    data: {
      orgId: input.organizationId,
      allowedDomains,
      blockedActions,
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
  const allowedActions = normalizeActions(input.allowedActions);
  const allowedDomains = normalizeDomains(input.allowedDomains);
  return prisma.agentBehaviorBaseline.upsert({
    where: {
      workflowId: input.workflowId,
    },
    update: {
      allowedActions,
      allowedDomains,
    },
    create: {
      workflowId: input.workflowId,
      allowedActions,
      allowedDomains,
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

export function inferBehaviorBaselineFromWorkflowDefinition(definition: unknown): {
  allowedActions: string[];
  allowedDomains: string[];
} {
  const parsed = definition as {
    steps?: Array<{
      action?: string;
      target?: string;
    }>;
  };
  const actions = new Set<string>();
  const domains = new Set<string>();

  for (const step of parsed.steps ?? []) {
    if (typeof step.action === "string" && step.action.trim().length > 0) {
      actions.add(step.action.trim().toLowerCase());
    }
    if (typeof step.target === "string" && step.target.startsWith("http")) {
      try {
        domains.add(new URL(step.target).hostname.toLowerCase());
      } catch {
        // Ignore invalid targets while inferring baseline.
      }
    }
  }

  return {
    allowedActions: [...actions],
    allowedDomains: [...domains],
  };
}
