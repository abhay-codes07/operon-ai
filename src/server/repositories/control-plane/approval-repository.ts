import { prisma } from "@/server/db/client";

export async function createApprovalRequest(input: {
  organizationId: string;
  executionId?: string;
  workflowId?: string;
  stepKey?: string;
  actionType: string;
  actionPayload: Record<string, unknown>;
  expiresAt?: Date;
}) {
  return prisma.approvalRequest.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      workflowId: input.workflowId,
      stepKey: input.stepKey,
      actionType: input.actionType,
      actionPayload: input.actionPayload,
      expiresAt: input.expiresAt,
    },
  });
}

export async function listPendingApprovals(organizationId: string) {
  return prisma.approvalRequest.findMany({
    where: {
      organizationId,
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "asc",
    },
    take: 200,
  });
}

export async function getPendingApprovalForStep(input: {
  organizationId: string;
  executionId: string;
  stepKey: string;
}) {
  return prisma.approvalRequest.findFirst({
    where: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      stepKey: input.stepKey,
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "desc",
    },
  });
}

export async function resolveApprovalRequest(input: {
  approvalRequestId: string;
  reviewerId: string;
  approve: boolean;
  note?: string;
}) {
  return prisma.approvalRequest.update({
    where: {
      id: input.approvalRequestId,
    },
    data: {
      status: input.approve ? "APPROVED" : "REJECTED",
      reviewedById: input.reviewerId,
      reviewNote: input.note,
      reviewedAt: new Date(),
    },
  });
}
