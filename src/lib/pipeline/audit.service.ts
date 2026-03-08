import { prisma } from "@/server/db/client";

async function resolveAuditAgentId(orgId: string, preferredAgentId?: string): Promise<string | null> {
  if (preferredAgentId) {
    return preferredAgentId;
  }

  const agent = await prisma.agent.findFirst({
    where: { organizationId: orgId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return agent?.id ?? null;
}

export async function logPipelineAuditEvent(input: {
  orgId: string;
  pipelineId: string;
  eventType:
    | "PIPELINE_CREATED"
    | "PIPELINE_STARTED"
    | "PIPELINE_STEP_COMPLETED"
    | "PIPELINE_FAILED"
    | "PIPELINE_RESUMED";
  message: string;
  metadata?: Record<string, unknown>;
  agentId?: string;
}) {
  const agentId = await resolveAuditAgentId(input.orgId, input.agentId);
  if (!agentId) {
    return null;
  }

  const audit = await prisma.executionAudit.create({
    data: {
      organizationId: input.orgId,
      agentId,
      action: input.eventType,
      intentHash: `${input.pipelineId}:${input.eventType}:${Date.now()}`,
      policyDecision: "ALLOW",
      result: "APPROVED",
      riskLevel: "LOW",
      riskScore: 5,
      metadata: {
        pipelineId: input.pipelineId,
        ...(input.metadata ?? {}),
      },
    },
  });

  return prisma.auditEvent.create({
    data: {
      organizationId: input.orgId,
      executionAuditId: audit.id,
      eventType: input.eventType,
      message: input.message,
      metadata: {
        pipelineId: input.pipelineId,
        ...(input.metadata ?? {}),
      },
    },
  });
}
