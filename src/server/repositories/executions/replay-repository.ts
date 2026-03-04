import type { DomSnapshotItem, ExecutionStepItem } from "@/modules/executions/contracts";
import {
  createDomSnapshotInputSchema,
  upsertExecutionStepsInputSchema,
} from "@/modules/executions/schemas";
import { prisma } from "@/server/db/client";

export async function replaceExecutionSteps(input: unknown): Promise<ExecutionStepItem[]> {
  const parsed = upsertExecutionStepsInputSchema.parse(input);

  await prisma.executionStep.deleteMany({
    where: {
      organizationId: parsed.organizationId,
      executionId: parsed.executionId,
    },
  });

  if (parsed.steps.length === 0) {
    return [];
  }

  await prisma.executionStep.createMany({
    data: parsed.steps.map((step) => ({
      executionId: parsed.executionId,
      organizationId: parsed.organizationId,
      stepIndex: step.stepIndex,
      stepKey: step.stepKey,
      action: step.action,
      target: step.target,
      status: step.status,
      metadata: step.metadata,
      startedAt: step.startedAt,
      finishedAt: step.finishedAt,
    })),
  });

  return prisma.executionStep.findMany({
    where: {
      organizationId: parsed.organizationId,
      executionId: parsed.executionId,
    },
    orderBy: {
      stepIndex: "asc",
    },
    select: {
      id: true,
      executionId: true,
      organizationId: true,
      stepIndex: true,
      stepKey: true,
      action: true,
      target: true,
      status: true,
      metadata: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
    },
  });
}

export async function createDomSnapshot(input: unknown): Promise<DomSnapshotItem> {
  const parsed = createDomSnapshotInputSchema.parse(input);

  return prisma.domSnapshot.create({
    data: {
      organizationId: parsed.organizationId,
      executionId: parsed.executionId,
      executionStepId: parsed.executionStepId,
      pageUrl: parsed.pageUrl,
      domHtml: parsed.domHtml,
      metadata: parsed.metadata,
    },
    select: {
      id: true,
      executionId: true,
      executionStepId: true,
      organizationId: true,
      pageUrl: true,
      domHtml: true,
      metadata: true,
      capturedAt: true,
    },
  });
}

export async function listExecutionSteps(
  organizationId: string,
  executionId: string,
): Promise<ExecutionStepItem[]> {
  return prisma.executionStep.findMany({
    where: {
      organizationId,
      executionId,
    },
    orderBy: {
      stepIndex: "asc",
    },
    select: {
      id: true,
      executionId: true,
      organizationId: true,
      stepIndex: true,
      stepKey: true,
      action: true,
      target: true,
      status: true,
      metadata: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
    },
  });
}

export async function listDomSnapshots(
  organizationId: string,
  executionId: string,
): Promise<DomSnapshotItem[]> {
  return prisma.domSnapshot.findMany({
    where: {
      organizationId,
      executionId,
    },
    orderBy: {
      capturedAt: "asc",
    },
    select: {
      id: true,
      executionId: true,
      executionStepId: true,
      organizationId: true,
      pageUrl: true,
      domHtml: true,
      metadata: true,
      capturedAt: true,
    },
  });
}
