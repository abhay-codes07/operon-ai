import type { WorkflowStatus } from "@prisma/client";

import {
  createWorkflow,
  getWorkflowById,
  listWorkflows,
  updateWorkflowStatus,
} from "@/server/repositories/workflows/workflow-repository";
import type { CreateWorkflowRequest } from "@/modules/workflows/schemas";
import { buildWorkflowDefinition } from "@/server/services/workflows/workflow-builder";
import { normalizeCronExpression } from "@/lib/utils/cron";
import { createSandboxIdentity } from "@/lib/sandbox/identity-vault.service";
import { recordBlastRadiusScore } from "@/lib/sandbox/blast-radius.service";

export async function createWorkflowTemplate(input: {
  organizationId: string;
  agentId: string;
  createdById: string;
  name: string;
  description?: string;
  scheduleCron?: string;
  definition: {
    naturalLanguageTask: string;
    steps: Array<{
      id: string;
      action: string;
      target: string;
      expectedOutcome: string;
    }>;
    guardrails: string[];
    timeoutSeconds: number;
    retryLimit: number;
  };
}) {
  return createWorkflow(input);
}

export async function createWorkflowFromTask(input: {
  organizationId: string;
  createdById: string;
  payload: CreateWorkflowRequest;
}) {
  const definition = buildWorkflowDefinition({
    naturalLanguageTask: input.payload.naturalLanguageTask,
    targetUrl: input.payload.targetUrl,
    guardrails: input.payload.guardrails,
    timeoutSeconds: input.payload.timeoutSeconds,
    retryLimit: input.payload.retryLimit,
  });

  const workflow = await createWorkflowTemplate({
    organizationId: input.organizationId,
    createdById: input.createdById,
    agentId: input.payload.agentId,
    name: input.payload.name,
    description: input.payload.description,
    scheduleCron: normalizeCronExpression(input.payload.scheduleCron),
    definition,
  });

  await createSandboxIdentity({
    organizationId: input.organizationId,
    workflowId: workflow.id,
    workflowName: workflow.name,
  }).catch(() => null);

  await recordBlastRadiusScore({
    organizationId: input.organizationId,
    workflowId: workflow.id,
    authenticatedDomains: 0,
    credentialScope: "DOMAIN",
    privilegeLevel: "LOW",
    isolationLevel: "STRONG",
  }).catch(() => null);

  return workflow;
}

export async function fetchWorkflowCatalog(input: {
  organizationId: string;
  agentId?: string;
  status?: WorkflowStatus;
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  return listWorkflows({
    organizationId: input.organizationId,
    agentId: input.agentId,
    status: input.status,
    query: input.query,
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

export async function fetchWorkflowById(input: { organizationId: string; workflowId: string }) {
  return getWorkflowById(input.organizationId, input.workflowId);
}
