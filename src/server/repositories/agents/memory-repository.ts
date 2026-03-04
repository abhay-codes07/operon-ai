import { prisma } from "@/server/db/client";

type UpsertAgentMemoryInput = {
  organizationId: string;
  agentId: string;
  workflowId?: string;
  sourceExecutionId?: string;
  kind: "RUN_METADATA" | "PATTERN" | "FAILURE_RESOLUTION";
  memoryKey: string;
  memoryValue: Record<string, unknown>;
  confidence?: number;
};

export async function upsertAgentMemory(input: UpsertAgentMemoryInput) {
  return prisma.agentMemory.upsert({
    where: {
      organizationId_agentId_workflowId_memoryKey: {
        organizationId: input.organizationId,
        agentId: input.agentId,
        workflowId: input.workflowId ?? null,
        memoryKey: input.memoryKey,
      },
    },
    update: {
      kind: input.kind,
      memoryValue: input.memoryValue,
      sourceExecutionId: input.sourceExecutionId,
      confidence: input.confidence,
    },
    create: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      workflowId: input.workflowId,
      sourceExecutionId: input.sourceExecutionId,
      kind: input.kind,
      memoryKey: input.memoryKey,
      memoryValue: input.memoryValue,
      confidence: input.confidence,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      sourceExecutionId: true,
      kind: true,
      memoryKey: true,
      memoryValue: true,
      confidence: true,
      updatedAt: true,
    },
  });
}

export async function listAgentMemory(input: {
  organizationId: string;
  agentId: string;
  workflowId?: string;
}) {
  return prisma.agentMemory.findMany({
    where: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      workflowId: input.workflowId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      sourceExecutionId: true,
      kind: true,
      memoryKey: true,
      memoryValue: true,
      confidence: true,
      updatedAt: true,
    },
    take: 50,
  });
}
