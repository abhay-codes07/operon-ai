import {
  createTool,
  createToolExecution,
  createToolVersion,
  getToolById,
  incrementToolUsageAndReliability,
  installToolToWorkflow,
  listTools,
  listToolVersions,
  listWorkflowInstalledTools,
} from "@/server/repositories/tools/tool-registry-repository";

export async function registerTool(input: {
  organizationId: string;
  createdByAgentId?: string;
  name: string;
  description: string;
  workflowSteps: Array<{ id: string; action: string; target?: string; expectedOutcome?: string }>;
  notes?: string;
}) {
  return createTool(input);
}

export async function retrieveToolCatalog(input: { organizationId: string; query?: string }) {
  return listTools(input.organizationId, input.query);
}

export async function retrieveToolById(input: { organizationId: string; toolId: string }) {
  return getToolById(input.organizationId, input.toolId);
}

export async function versionTool(input: {
  organizationId: string;
  toolId: string;
  workflowSteps: Array<{ id: string; action: string; target?: string; expectedOutcome?: string }>;
  notes?: string;
}) {
  return createToolVersion(input);
}

export async function retrieveToolVersions(input: { organizationId: string; toolId: string }) {
  return listToolVersions(input.organizationId, input.toolId);
}

export async function recordToolExecution(input: {
  organizationId: string;
  toolId: string;
  toolVersionId: string;
  executionId?: string;
  status: "SUCCEEDED" | "FAILED";
  durationMs: number;
  output?: Record<string, unknown>;
  errorMessage?: string;
}) {
  const execution = await createToolExecution(input);
  await incrementToolUsageAndReliability({
    toolId: input.toolId,
    success: input.status === "SUCCEEDED",
  });
  return execution;
}

export async function installTool(input: {
  organizationId: string;
  workflowId: string;
  toolId: string;
  toolVersionId: string;
  installedById?: string;
  config?: Record<string, unknown>;
}) {
  return installToolToWorkflow(input);
}

export async function fetchInstalledTools(input: { organizationId: string; workflowId: string }) {
  return listWorkflowInstalledTools(input);
}
