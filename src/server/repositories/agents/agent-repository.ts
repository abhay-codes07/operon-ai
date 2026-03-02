import type { AgentStatus } from "@prisma/client";

import type { AgentListItem } from "@/modules/agents/contracts";
import { createAgentInputSchema, updateAgentStatusInputSchema } from "@/modules/agents/schemas";
import { prisma } from "@/server/db/client";

type ListAgentsInput = {
  organizationId: string;
  status?: AgentStatus;
  limit?: number;
};

export async function createAgent(input: unknown): Promise<AgentListItem> {
  const parsed = createAgentInputSchema.parse(input);

  return prisma.agent.create({
    data: {
      organizationId: parsed.organizationId,
      createdById: parsed.createdById,
      name: parsed.name,
      description: parsed.description,
      metadata: parsed.metadata,
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function listAgents(input: ListAgentsInput): Promise<AgentListItem[]> {
  return prisma.agent.findMany({
    where: {
      organizationId: input.organizationId,
      status: input.status,
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: input.limit ?? 50,
  });
}

export async function getAgentById(
  organizationId: string,
  agentId: string,
): Promise<AgentListItem | null> {
  return prisma.agent.findFirst({
    where: {
      id: agentId,
      organizationId,
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateAgentStatus(input: unknown): Promise<AgentListItem> {
  const parsed = updateAgentStatusInputSchema.parse(input);
  const existingAgent = await getAgentById(parsed.organizationId, parsed.agentId);

  if (!existingAgent) {
    throw new Error("Agent not found for organization");
  }

  return prisma.agent.update({
    where: {
      id: parsed.agentId,
    },
    data: {
      status: parsed.status,
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
