import {
  createApprovalRequest,
  getPendingApprovalForStep,
  listPendingApprovals,
  resolveApprovalRequest,
} from "@/server/repositories/control-plane/approval-repository";
import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";

const sensitiveActions = new Set(["submit", "payment", "account-change", "delete"]);

export function requiresApproval(action: string) {
  return sensitiveActions.has(action.toLowerCase());
}

export async function ensureApprovalForStep(input: {
  organizationId: string;
  executionId: string;
  workflowId?: string;
  stepKey: string;
  actionType: string;
  actionPayload: Record<string, unknown>;
}) {
  if (!requiresApproval(input.actionType)) {
    return { approved: true, request: null };
  }

  const existing = await getPendingApprovalForStep({
    organizationId: input.organizationId,
    executionId: input.executionId,
    stepKey: input.stepKey,
  });

  if (existing) {
    return { approved: false, request: existing };
  }

  const request = await createApprovalRequest({
    organizationId: input.organizationId,
    executionId: input.executionId,
    workflowId: input.workflowId,
    stepKey: input.stepKey,
    actionType: input.actionType,
    actionPayload: input.actionPayload,
    expiresAt: new Date(Date.now() + 15 * 60_000),
  });

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "approval.requested",
    payload: {
      approvalRequestId: request.id,
      stepKey: input.stepKey,
      actionType: input.actionType,
    },
  });

  return { approved: false, request };
}

export async function fetchApprovalQueue(organizationId: string) {
  return listPendingApprovals(organizationId);
}

export async function reviewApprovalRequest(input: {
  organizationId: string;
  approvalRequestId: string;
  reviewerId: string;
  approve: boolean;
  note?: string;
  executionId?: string;
}) {
  const review = await resolveApprovalRequest({
    approvalRequestId: input.approvalRequestId,
    reviewerId: input.reviewerId,
    approve: input.approve,
    note: input.note,
  });

  if (input.executionId) {
    await publishExecutionStreamEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      eventType: "approval.reviewed",
      payload: {
        approvalRequestId: input.approvalRequestId,
        decision: input.approve ? "APPROVED" : "REJECTED",
      },
    });
  }

  return review;
}
