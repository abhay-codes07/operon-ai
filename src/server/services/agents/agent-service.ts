import type { AgentStatus } from "@prisma/client";

import { createAgent, listAgents, updateAgentStatus } from "@/server/repositories/agents/agent-repository";

export async function provisionAgent(input: {
  organizationId: string;
  createdById: string;
  name: string;
  description?: string;
}) {
  return createAgent(input);
}

export async function fetchAgentCatalog(input: {
  organizationId: string;
  status?: AgentStatus;
  page?: number;
  pageSize?: number;
}) {
  return listAgents({
    organizationId: input.organizationId,
    status: input.status,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
    },
  });
}

export async function changeAgentStatus(input: {
  organizationId: string;
  agentId: string;
  status: AgentStatus;
}) {
  return updateAgentStatus(input);
}
