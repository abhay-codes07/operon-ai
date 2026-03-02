import type { WorkflowStatus } from "@prisma/client";

import type { WorkflowListItem } from "@/modules/workflows/contracts";
import {
  createWorkflowInputSchema,
  updateWorkflowStatusSchema,
} from "@/modules/workflows/schemas";
import { prisma } from "@/server/db/client";

type ListWorkflowsInput = {
  organizationId: string;
  agentId?: string;
  status?: WorkflowStatus;
  limit?: number;
};

export async function createWorkflow(input: unknown): Promise<WorkflowListItem> {
  const parsed = createWorkflowInputSchema.parse(input);

  return prisma.workflow.create({
    data: {
      organizationId: parsed.organizationId,
      agentId: parsed.agentId,
      createdById: parsed.createdById,
      name: parsed.name,
      description: parsed.description,
      scheduleCron: parsed.scheduleCron,
      definition: parsed.definition,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      name: true,
      status: true,
      scheduleCron: true,
      createdAt: true,
    },
  });
}

export async function listWorkflows(input: ListWorkflowsInput): Promise<WorkflowListItem[]> {
  return prisma.workflow.findMany({
    where: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      status: input.status,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      name: true,
      status: true,
      scheduleCron: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit ?? 50,
  });
}

export async function updateWorkflowStatus(input: unknown): Promise<WorkflowListItem> {
  const parsed = updateWorkflowStatusSchema.parse(input);
  const existing = await prisma.workflow.findFirst({
    where: {
      id: parsed.workflowId,
      organizationId: parsed.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Workflow not found for organization");
  }

  return prisma.workflow.update({
    where: {
      id: parsed.workflowId,
    },
    data: {
      status: parsed.status,
    },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      name: true,
      status: true,
      scheduleCron: true,
      createdAt: true,
    },
  });
}
