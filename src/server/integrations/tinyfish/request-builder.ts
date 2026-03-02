import type { WorkflowDefinition } from "@/modules/workflows/contracts";

import type { TinyFishExecutionRequest } from "./types";

type BuildTinyFishExecutionRequestInput = {
  requestId: string;
  organizationId: string;
  agentId: string;
  workflowId: string;
  workflowName: string;
  definition: WorkflowDefinition;
  metadata?: Record<string, unknown>;
};

export function buildTinyFishExecutionRequest(
  input: BuildTinyFishExecutionRequestInput,
): TinyFishExecutionRequest {
  return {
    requestId: input.requestId,
    organizationId: input.organizationId,
    agentId: input.agentId,
    workflowId: input.workflowId,
    workflowName: input.workflowName,
    naturalLanguageTask: input.definition.naturalLanguageTask,
    steps: input.definition.steps.map((step) => ({
      id: step.id,
      action: step.action,
      target: step.target,
      expectedOutcome: step.expectedOutcome,
    })),
    guardrails: input.definition.guardrails,
    timeoutSeconds: input.definition.timeoutSeconds,
    retryLimit: input.definition.retryLimit,
    metadata: input.metadata,
  };
}
