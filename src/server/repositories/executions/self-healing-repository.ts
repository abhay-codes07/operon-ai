import type { SelfHealingRecordItem } from "@/modules/executions/contracts";
import { prisma } from "@/server/db/client";

type CreateSelfHealingRecordInput = {
  organizationId: string;
  executionId: string;
  executionStepId?: string;
  originalSelector?: string;
  resolvedSelector: string;
  strategy: string;
  similarityScore: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
};

export async function createSelfHealingRecord(
  input: CreateSelfHealingRecordInput,
): Promise<SelfHealingRecordItem> {
  return prisma.selfHealingRecord.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      executionStepId: input.executionStepId,
      originalSelector: input.originalSelector,
      resolvedSelector: input.resolvedSelector,
      strategy: input.strategy,
      similarityScore: input.similarityScore,
      success: input.success,
      metadata: input.metadata,
    },
    select: {
      id: true,
      executionId: true,
      executionStepId: true,
      organizationId: true,
      originalSelector: true,
      resolvedSelector: true,
      strategy: true,
      similarityScore: true,
      success: true,
      metadata: true,
      createdAt: true,
    },
  });
}

export async function listSelfHealingRecords(
  organizationId: string,
  executionId: string,
): Promise<SelfHealingRecordItem[]> {
  return prisma.selfHealingRecord.findMany({
    where: {
      organizationId,
      executionId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      executionId: true,
      executionStepId: true,
      organizationId: true,
      originalSelector: true,
      resolvedSelector: true,
      strategy: true,
      similarityScore: true,
      success: true,
      metadata: true,
      createdAt: true,
    },
  });
}
