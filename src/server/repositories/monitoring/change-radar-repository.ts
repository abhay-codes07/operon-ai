import { prisma } from "@/server/db/client";

export async function createPageSnapshot(input: {
  organizationId: string;
  executionId: string;
  workflowId?: string;
  url: string;
  domHash: string;
  snapshotRef?: string;
}) {
  return prisma.pageSnapshot.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      workflowId: input.workflowId,
      url: input.url,
      domHash: input.domHash,
      snapshotRef: input.snapshotRef,
    },
    select: {
      id: true,
      organizationId: true,
      workflowId: true,
      url: true,
      domHash: true,
      capturedAt: true,
    },
  });
}

export async function findLatestSnapshotForUrl(input: {
  organizationId: string;
  workflowId?: string;
  url: string;
}) {
  return prisma.pageSnapshot.findFirst({
    where: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      url: input.url,
    },
    orderBy: {
      capturedAt: "desc",
    },
    select: {
      id: true,
      domHash: true,
      capturedAt: true,
    },
  });
}

export async function createChangeEvent(input: {
  organizationId: string;
  executionId: string;
  workflowId?: string;
  pageSnapshotId: string;
  changeType: "ADDED" | "REMOVED" | "MODIFIED";
  severity: "LOW" | "MEDIUM" | "HIGH";
  previousHash?: string;
  currentHash: string;
  details?: Record<string, unknown>;
}) {
  return prisma.changeEvent.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      workflowId: input.workflowId,
      pageSnapshotId: input.pageSnapshotId,
      changeType: input.changeType,
      severity: input.severity,
      previousHash: input.previousHash,
      currentHash: input.currentHash,
      details: input.details,
    },
  });
}

export async function listRecentChangeEvents(organizationId: string) {
  return prisma.changeEvent.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      detectedAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      workflowId: true,
      executionId: true,
      changeType: true,
      severity: true,
      previousHash: true,
      currentHash: true,
      details: true,
      detectedAt: true,
      pageSnapshot: {
        select: {
          url: true,
        },
      },
    },
  });
}
