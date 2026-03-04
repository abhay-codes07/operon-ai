import { prisma } from "@/server/db/client";

export async function createWorkflowSimulation(input: {
  organizationId: string;
  workflowId: string;
  requestedById?: string;
  status: "READY" | "FAILED";
  predictedPath: Array<Record<string, unknown>>;
  warnings: string[];
}) {
  return prisma.workflowSimulation.create({
    data: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      requestedById: input.requestedById,
      status: input.status,
      predictedPath: input.predictedPath,
      warnings: input.warnings,
    },
    select: {
      id: true,
      organizationId: true,
      workflowId: true,
      status: true,
      predictedPath: true,
      warnings: true,
      createdAt: true,
    },
  });
}

export async function listWorkflowSimulations(input: {
  organizationId: string;
  workflowId: string;
}) {
  return prisma.workflowSimulation.findMany({
    where: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      organizationId: true,
      workflowId: true,
      status: true,
      predictedPath: true,
      warnings: true,
      createdAt: true,
    },
  });
}
