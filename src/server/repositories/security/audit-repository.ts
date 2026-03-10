import { prisma } from "@/server/db/client";

type AuditResult = "APPROVED" | "BLOCKED" | "FAILED";
type PolicyDecision = "ALLOW" | "DENY";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export async function createExecutionAudit(input: {
  organizationId: string;
  executionId?: string;
  agentId: string;
  action: string;
  targetDomain?: string;
  intentHash: string;
  policyDecision: PolicyDecision;
  result: AuditResult;
  riskLevel: RiskLevel;
  riskScore: number;
  riskReason?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.executionAudit.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      agentId: input.agentId,
      action: input.action,
      targetDomain: input.targetDomain,
      intentHash: input.intentHash,
      policyDecision: input.policyDecision,
      result: input.result,
      riskLevel: input.riskLevel,
      riskScore: input.riskScore,
      riskReason: input.riskReason,
      metadata: input.metadata,
    },
  });
}

export async function updateExecutionAuditResult(input: {
  organizationId: string;
  executionAuditId: string;
  result: AuditResult;
  policyDecision?: PolicyDecision;
  riskLevel?: RiskLevel;
  riskScore?: number;
  riskReason?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.executionAudit.updateMany({
    where: {
      id: input.executionAuditId,
      organizationId: input.organizationId,
    },
    data: {
      result: input.result,
      policyDecision: input.policyDecision,
      riskLevel: input.riskLevel,
      riskScore: input.riskScore,
      riskReason: input.riskReason,
      metadata: input.metadata,
    },
  });
}

export async function appendAuditEvent(input: {
  organizationId: string;
  executionAuditId: string;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      executionAuditId: input.executionAuditId,
      eventType: input.eventType,
      message: input.message,
      metadata: input.metadata,
    },
  });
}

export async function listExecutionAudits(input: {
  organizationId: string;
  agentId?: string;
  result?: AuditResult;
  limit?: number;
}) {
  return prisma.executionAudit.findMany({
    where: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      result: input.result,
    },
    include: {
      events: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 5,
      },
      agent: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: input.limit ?? 100,
  });
}

export async function countRecentAgentAudits(input: {
  organizationId: string;
  agentId: string;
  from: Date;
  result?: AuditResult;
}) {
  return prisma.executionAudit.count({
    where: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      occurredAt: {
        gte: input.from,
      },
      result: input.result,
    },
  });
}
