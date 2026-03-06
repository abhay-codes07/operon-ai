import type { ExecutionStatus, WorkflowReleaseStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

export async function createWorkflowRelease(input: {
  organizationId: string;
  agentId: string;
  stableWorkflowId: string;
  canaryWorkflowId: string;
  canaryTrafficPercent: number;
  autoRollbackEnabled: boolean;
  failureThresholdPct: number;
  minCanarySampleSize: number;
}) {
  return prisma.workflowRelease.create({
    data: input,
  });
}

export async function listWorkflowReleases(organizationId: string) {
  return prisma.workflowRelease.findMany({
    where: { organizationId },
    include: {
      stableWorkflow: {
        select: { id: true, name: true },
      },
      canaryWorkflow: {
        select: { id: true, name: true },
      },
      metricSnapshots: {
        orderBy: { capturedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findActiveReleaseByWorkflow(input: {
  organizationId: string;
  workflowId: string;
}) {
  return prisma.workflowRelease.findFirst({
    where: {
      organizationId: input.organizationId,
      status: "ACTIVE",
      OR: [{ stableWorkflowId: input.workflowId }, { canaryWorkflowId: input.workflowId }],
    },
  });
}

export async function incrementReleaseRouting(input: {
  organizationId: string;
  workflowReleaseId: string;
  lane: "STABLE" | "CANARY";
}) {
  return prisma.workflowRelease.updateMany({
    where: {
      id: input.workflowReleaseId,
      organizationId: input.organizationId,
    },
    data: {
      totalRouted: { increment: 1 },
      stableRouted: input.lane === "STABLE" ? { increment: 1 } : undefined,
      canaryRouted: input.lane === "CANARY" ? { increment: 1 } : undefined,
    },
  });
}

export async function createReleaseRoutingLog(input: {
  organizationId: string;
  workflowReleaseId: string;
  executionId: string;
  workflowId: string;
  lane: "STABLE" | "CANARY";
}) {
  return prisma.releaseRoutingLog.create({
    data: input,
  });
}

export async function updateReleaseRoutingStatus(input: {
  organizationId: string;
  executionId: string;
  status: ExecutionStatus;
}) {
  return prisma.releaseRoutingLog.updateMany({
    where: {
      organizationId: input.organizationId,
      executionId: input.executionId,
    },
    data: {
      status: input.status,
    },
  });
}

export async function listReleaseRoutingLogs(input: {
  organizationId: string;
  workflowReleaseId: string;
  lane?: "STABLE" | "CANARY";
  limit?: number;
}) {
  return prisma.releaseRoutingLog.findMany({
    where: {
      organizationId: input.organizationId,
      workflowReleaseId: input.workflowReleaseId,
      lane: input.lane,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit ?? 200,
  });
}

export async function createReleaseMetricSnapshot(input: {
  organizationId: string;
  workflowReleaseId: string;
  canarySampleSize: number;
  canaryFailurePct: number;
  canarySuccessPct: number;
  stableSampleSize: number;
  stableFailurePct: number;
}) {
  return prisma.releaseMetricSnapshot.create({
    data: input,
  });
}

export async function updateReleaseStatus(input: {
  organizationId: string;
  workflowReleaseId: string;
  status: WorkflowReleaseStatus;
}) {
  return prisma.workflowRelease.updateMany({
    where: {
      id: input.workflowReleaseId,
      organizationId: input.organizationId,
    },
    data: {
      status: input.status,
    },
  });
}

export async function getWorkflowRelease(input: { organizationId: string; workflowReleaseId: string }) {
  return prisma.workflowRelease.findFirst({
    where: {
      id: input.workflowReleaseId,
      organizationId: input.organizationId,
    },
  });
}
