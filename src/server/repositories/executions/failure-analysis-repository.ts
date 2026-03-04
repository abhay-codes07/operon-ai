import { prisma } from "@/server/db/client";

export async function fetchExecutionFailureContext(input: {
  organizationId: string;
  executionId: string;
}) {
  const [execution, logs, steps, snapshots] = await Promise.all([
    prisma.execution.findFirst({
      where: {
        id: input.executionId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        status: true,
        errorMessage: true,
      },
    }),
    prisma.executionLog.findMany({
      where: {
        executionId: input.executionId,
        organizationId: input.organizationId,
      },
      orderBy: {
        occurredAt: "asc",
      },
      select: {
        message: true,
        metadata: true,
      },
      take: 300,
    }),
    prisma.executionStep.findMany({
      where: {
        executionId: input.executionId,
        organizationId: input.organizationId,
      },
      orderBy: {
        stepIndex: "asc",
      },
      select: {
        stepKey: true,
        action: true,
        target: true,
        status: true,
      },
    }),
    prisma.domSnapshot.findMany({
      where: {
        executionId: input.executionId,
        organizationId: input.organizationId,
      },
      orderBy: {
        capturedAt: "desc",
      },
      select: {
        domHtml: true,
        pageUrl: true,
      },
      take: 3,
    }),
  ]);

  return {
    execution,
    logs,
    steps,
    snapshots,
  };
}

export async function upsertFailureAnalysis(input: {
  organizationId: string;
  executionId: string;
  category: "SELECTOR_DRIFT" | "NAVIGATION_FAILURE" | "AUTHENTICATION_ISSUE" | "PAGE_LOAD_TIMEOUT" | "UNKNOWN";
  summary: string;
  evidence?: Record<string, unknown>;
}) {
  return prisma.failureAnalysis.upsert({
    where: {
      executionId: input.executionId,
    },
    update: {
      category: input.category,
      summary: input.summary,
      evidence: input.evidence,
    },
    create: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      category: input.category,
      summary: input.summary,
      evidence: input.evidence,
    },
    select: {
      id: true,
      executionId: true,
      category: true,
      summary: true,
      evidence: true,
      updatedAt: true,
    },
  });
}

export async function getFailureAnalysis(input: { organizationId: string; executionId: string }) {
  return prisma.failureAnalysis.findFirst({
    where: {
      organizationId: input.organizationId,
      executionId: input.executionId,
    },
    select: {
      id: true,
      executionId: true,
      category: true,
      summary: true,
      evidence: true,
      updatedAt: true,
    },
  });
}
