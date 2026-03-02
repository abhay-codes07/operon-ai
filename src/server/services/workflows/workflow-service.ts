import type { WorkflowStatus } from "@prisma/client";

import {
  createWorkflow,
  listWorkflows,
  updateWorkflowStatus,
} from "@/server/repositories/workflows/workflow-repository";

export async function createWorkflowTemplate(input: {
  organizationId: string;
  agentId: string;
  createdById: string;
  name: string;
  description?: string;
  scheduleCron?: string;
  definition: Record<string, unknown>;
}) {
  return createWorkflow(input);
}

export async function fetchWorkflowCatalog(input: {
  organizationId: string;
  agentId?: string;
  status?: WorkflowStatus;
  page?: number;
  pageSize?: number;
}) {
  return listWorkflows({
    organizationId: input.organizationId,
    agentId: input.agentId,
    status: input.status,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
    },
  });
}

export async function changeWorkflowStatus(input: {
  organizationId: string;
  workflowId: string;
  status: WorkflowStatus;
}) {
  return updateWorkflowStatus(input);
}
