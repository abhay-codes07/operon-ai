import type { WorkflowStatus } from "@prisma/client";

import type { WorkflowListItem } from "@/modules/workflows/contracts";
import {
  createWorkflowInputSchema,
  updateWorkflowStatusSchema,
} from "@/modules/workflows/schemas";
import { prisma } from "@/server/db/client";
import {
  normalizePagination,
  type PaginationInput,
  toPaginatedResult,
} from "@/server/repositories/shared/pagination";
import type { PaginatedResult } from "@/types/pagination";

type ListWorkflowsInput = {
  organizationId: string;
  agentId?: string;
  status?: WorkflowStatus;
  query?: string;
  pagination?: PaginationInput;
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
      description: true,
      status: true,
      scheduleCron: true,
      definition: true,
      createdAt: true,
    },
  });
}

export async function listWorkflows(
  input: ListWorkflowsInput,
): Promise<PaginatedResult<WorkflowListItem>> {
  const pagination = normalizePagination(input.pagination);
  const trimmedQuery = input.query?.trim();
  const where = {
    organizationId: input.organizationId,
    agentId: input.agentId,
    status: input.status,
    OR: trimmedQuery
      ? [
          {
            name: {
              contains: trimmedQuery,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: trimmedQuery,
              mode: "insensitive" as const,
            },
          },
        ]
      : undefined,
  };
  const [items, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        agentId: true,
        name: true,
        description: true,
        status: true,
        scheduleCron: true,
        definition: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.workflow.count({ where }),
  ]);

  return toPaginatedResult(items, total, pagination);
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
      description: true,
      status: true,
      scheduleCron: true,
      definition: true,
      createdAt: true,
    },
  });
}
