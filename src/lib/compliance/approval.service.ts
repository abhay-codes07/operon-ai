import { prisma } from "@/server/db/client";

function workflowVersionFromUpdatedAt(updatedAt: Date): string {
  return updatedAt.toISOString();
}

async function logWorkflowApprovalAudit(input: {
  organizationId: string;
  agentId: string;
  workflowId: string;
  action: "WORKFLOW_APPROVAL_REQUESTED" | "WORKFLOW_APPROVED" | "WORKFLOW_REVOKED";
  metadata?: Record<string, unknown>;
}) {
  const audit = await prisma.executionAudit.create({
    data: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      action: input.action,
      intentHash: `${input.workflowId}:${input.action}:${Date.now()}`,
      policyDecision: "ALLOW",
      result: "APPROVED",
      riskLevel: "LOW",
      riskScore: 0,
      metadata: {
        workflowId: input.workflowId,
        ...(input.metadata ?? {}),
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      executionAuditId: audit.id,
      eventType: input.action,
      message: `Compliance approval audit event: ${input.action}`,
      metadata: input.metadata,
    },
  });
}

export async function requestWorkflowApproval(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, updatedAt: true, organizationId: true, agentId: true },
  });
  if (!workflow) {
    return null;
  }

  await logWorkflowApprovalAudit({
    organizationId: workflow.organizationId,
    agentId: workflow.agentId,
    workflowId: workflow.id,
    action: "WORKFLOW_APPROVAL_REQUESTED",
  });

  return {
    workflowId: workflow.id,
    requestedVersion: workflowVersionFromUpdatedAt(workflow.updatedAt),
    requestedAt: new Date(),
  };
}

export async function approveWorkflow(workflowId: string, userId: string, approvalNotes?: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, updatedAt: true, organizationId: true, agentId: true },
  });
  if (!workflow) {
    return null;
  }

  const approval = await prisma.workflowComplianceApproval.create({
    data: {
      workflowId: workflow.id,
      version: workflowVersionFromUpdatedAt(workflow.updatedAt),
      approvedByUserId: userId,
      approvalNotes,
      organizationId: workflow.organizationId,
    },
  });

  await logWorkflowApprovalAudit({
    organizationId: workflow.organizationId,
    agentId: workflow.agentId,
    workflowId: workflow.id,
    action: "WORKFLOW_APPROVED",
    metadata: { approvalId: approval.id },
  });

  return approval;
}

export async function revokeApproval(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, organizationId: true, agentId: true },
  });
  if (!workflow) {
    return null;
  }

  const latestActive = await prisma.workflowComplianceApproval.findFirst({
    where: {
      workflowId,
      revokedAt: null,
    },
    orderBy: { approvedAt: "desc" },
  });
  if (!latestActive) {
    return null;
  }

  const approval = await prisma.workflowComplianceApproval.update({
    where: { id: latestActive.id },
    data: { revokedAt: new Date() },
  });

  await logWorkflowApprovalAudit({
    organizationId: workflow.organizationId,
    agentId: workflow.agentId,
    workflowId: workflow.id,
    action: "WORKFLOW_REVOKED",
    metadata: { approvalId: approval.id },
  });

  return approval;
}

export async function hasActiveWorkflowApproval(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, updatedAt: true },
  });
  if (!workflow) {
    return false;
  }

  const latestApproval = await prisma.workflowComplianceApproval.findFirst({
    where: {
      workflowId,
      revokedAt: null,
    },
    orderBy: { approvedAt: "desc" },
  });
  if (!latestApproval) {
    return false;
  }

  return latestApproval.version === workflowVersionFromUpdatedAt(workflow.updatedAt);
}

export async function listWorkflowApprovals(workflowId: string) {
  return prisma.workflowComplianceApproval.findMany({
    where: { workflowId },
    include: {
      approvedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { approvedAt: "desc" },
  });
}
