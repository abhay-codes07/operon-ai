import { prisma } from "@/server/db/client";

export async function upsertDomainKnowledge(input: {
  organizationId: string;
  domain: string;
  issueDelta?: number;
  stabilityScore?: number;
  metadata?: Record<string, unknown>;
}) {
  const existing = await prisma.domainKnowledge.findUnique({
    where: {
      organizationId_domain: {
        organizationId: input.organizationId,
        domain: input.domain,
      },
    },
    select: {
      id: true,
      issueCount: true,
    },
  });

  if (!existing) {
    return prisma.domainKnowledge.create({
      data: {
        organizationId: input.organizationId,
        domain: input.domain,
        issueCount: input.issueDelta ?? 0,
        stabilityScore: input.stabilityScore ?? 1,
        metadata: input.metadata,
      },
      select: {
        id: true,
        organizationId: true,
        domain: true,
        issueCount: true,
        stabilityScore: true,
      },
    });
  }

  return prisma.domainKnowledge.update({
    where: {
      id: existing.id,
    },
    data: {
      issueCount: existing.issueCount + (input.issueDelta ?? 0),
      stabilityScore: input.stabilityScore ?? undefined,
      metadata: input.metadata,
      lastSeenAt: new Date(),
    },
    select: {
      id: true,
      organizationId: true,
      domain: true,
      issueCount: true,
      stabilityScore: true,
    },
  });
}

export async function upsertSharedSignal(input: {
  organizationId: string;
  domainKnowledgeId?: string;
  signalType: string;
  signalKey: string;
  signalValue: Record<string, unknown>;
}) {
  return prisma.sharedSignal.upsert({
    where: {
      organizationId_signalType_signalKey: {
        organizationId: input.organizationId,
        signalType: input.signalType,
        signalKey: input.signalKey,
      },
    },
    update: {
      count: {
        increment: 1,
      },
      lastSeenAt: new Date(),
      signalValue: input.signalValue,
      domainKnowledgeId: input.domainKnowledgeId,
    },
    create: {
      organizationId: input.organizationId,
      domainKnowledgeId: input.domainKnowledgeId,
      signalType: input.signalType,
      signalKey: input.signalKey,
      signalValue: input.signalValue,
    },
  });
}

export async function createAgentInsight(input: {
  organizationId: string;
  agentId: string;
  domainKnowledgeId?: string;
  insightType: string;
  insightKey: string;
  insightValue: Record<string, unknown>;
  confidence: number;
}) {
  return prisma.agentInsight.create({
    data: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      domainKnowledgeId: input.domainKnowledgeId,
      insightType: input.insightType,
      insightKey: input.insightKey,
      insightValue: input.insightValue,
      confidence: input.confidence,
    },
  });
}

export async function fetchKnowledgeGraph(organizationId: string) {
  const [domains, signals, insights] = await Promise.all([
    prisma.domainKnowledge.findMany({
      where: { organizationId },
      orderBy: { lastSeenAt: "desc" },
      take: 100,
    }),
    prisma.sharedSignal.findMany({
      where: { organizationId },
      orderBy: { lastSeenAt: "desc" },
      take: 100,
    }),
    prisma.agentInsight.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  return { domains, signals, insights };
}
