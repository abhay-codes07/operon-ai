import { prisma } from "@/server/db/client";

export async function recordSelectorAlternative(input: {
  organizationId: string;
  workflowId: string;
  stepKey: string;
  originalSelector: string;
  alternativeSelector: string;
  confidence: number;
}) {
  return prisma.selectorHistory.upsert({
    where: {
      organizationId_workflowId_stepKey_originalSelector_alternativeSelector: {
        organizationId: input.organizationId,
        workflowId: input.workflowId,
        stepKey: input.stepKey,
        originalSelector: input.originalSelector,
        alternativeSelector: input.alternativeSelector,
      },
    },
    update: {
      failCount: {
        increment: 1,
      },
      confidence: input.confidence,
      lastSeenAt: new Date(),
    },
    create: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      stepKey: input.stepKey,
      originalSelector: input.originalSelector,
      alternativeSelector: input.alternativeSelector,
      confidence: input.confidence,
    },
  });
}

export async function listSelectorAlternatives(input: { organizationId: string; workflowId: string }) {
  return prisma.selectorHistory.findMany({
    where: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
    },
    orderBy: {
      lastSeenAt: "desc",
    },
    take: 100,
  });
}

export async function upsertAdaptiveWorkflow(input: {
  organizationId: string;
  workflowId: string;
  proposedDefinition: Record<string, unknown>;
  notes?: string;
  applied?: boolean;
}) {
  const existing = await prisma.adaptiveWorkflow.findUnique({
    where: {
      workflowId: input.workflowId,
    },
    select: {
      id: true,
      adaptationVersion: true,
    },
  });

  if (!existing) {
    return prisma.adaptiveWorkflow.create({
      data: {
        organizationId: input.organizationId,
        workflowId: input.workflowId,
        proposedDefinition: input.proposedDefinition,
        notes: input.notes,
        applied: input.applied ?? false,
      },
    });
  }

  return prisma.adaptiveWorkflow.update({
    where: {
      id: existing.id,
    },
    data: {
      adaptationVersion: existing.adaptationVersion + 1,
      proposedDefinition: input.proposedDefinition,
      notes: input.notes,
      applied: input.applied ?? false,
    },
  });
}

export async function getAdaptiveWorkflow(input: { organizationId: string; workflowId: string }) {
  return prisma.adaptiveWorkflow.findFirst({
    where: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
    },
  });
}
