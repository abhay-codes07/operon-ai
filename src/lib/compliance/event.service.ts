import type { ComplianceActionType } from "@prisma/client";

import { prisma } from "@/server/db/client";

async function resolveExecutionContext(runId: string) {
  return prisma.execution.findUnique({
    where: { id: runId },
    select: {
      id: true,
      workflowId: true,
      organizationId: true,
    },
  });
}

export async function recordDomainVisit(runId: string, domain: string) {
  const context = await resolveExecutionContext(runId);
  if (!context?.workflowId) {
    return null;
  }

  return prisma.complianceEvent.create({
    data: {
      workflowId: context.workflowId,
      runId: context.id,
      domainVisited: domain.toLowerCase(),
      actionType: "READ",
      organizationId: context.organizationId,
    },
  });
}

export async function recordAction(runId: string, actionType: ComplianceActionType) {
  const context = await resolveExecutionContext(runId);
  if (!context?.workflowId) {
    return null;
  }

  return prisma.complianceEvent.create({
    data: {
      workflowId: context.workflowId,
      runId: context.id,
      actionType,
      organizationId: context.organizationId,
    },
  });
}

export async function recordDataExtraction(runId: string, dataCategory: string) {
  const context = await resolveExecutionContext(runId);
  if (!context?.workflowId) {
    return null;
  }

  return prisma.complianceEvent.create({
    data: {
      workflowId: context.workflowId,
      runId: context.id,
      actionType: "EXTRACT",
      dataCategory,
      organizationId: context.organizationId,
    },
  });
}
