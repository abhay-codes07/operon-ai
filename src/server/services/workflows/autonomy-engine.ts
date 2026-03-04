import {
  getAdaptiveWorkflow,
  listSelectorAlternatives,
  recordSelectorAlternative,
  upsertAdaptiveWorkflow,
} from "@/server/repositories/workflows/autonomy-repository";
import { getWorkflowById } from "@/server/repositories/workflows/workflow-repository";

type WorkflowDefinition = {
  steps?: Array<{
    id?: string;
    action?: string;
    target?: string;
    expectedOutcome?: string;
  }>;
  [key: string]: unknown;
};

export async function registerSelectorFailure(input: {
  organizationId: string;
  workflowId: string;
  stepKey: string;
  originalSelector: string;
  alternativeSelector: string;
  confidence: number;
}) {
  return recordSelectorAlternative(input);
}

export async function generateAdaptiveWorkflowProposal(input: {
  organizationId: string;
  workflowId: string;
}) {
  const workflow = await getWorkflowById(input.organizationId, input.workflowId);
  if (!workflow) {
    throw new Error("Workflow not found for autonomy proposal");
  }

  const selectorHistory = await listSelectorAlternatives({
    organizationId: input.organizationId,
    workflowId: input.workflowId,
  });

  const topAlternatives = new Map<string, (typeof selectorHistory)[number]>();
  for (const item of selectorHistory) {
    const existing = topAlternatives.get(item.stepKey);
    if (!existing || item.failCount > existing.failCount || item.confidence > existing.confidence) {
      topAlternatives.set(item.stepKey, item);
    }
  }

  const definition = workflow.definition as WorkflowDefinition;
  const adaptedDefinition: WorkflowDefinition = {
    ...definition,
    steps: (definition.steps ?? []).map((step) => {
      if (!step.id) {
        return step;
      }

      const replacement = topAlternatives.get(step.id);
      if (!replacement || replacement.failCount < 2) {
        return step;
      }

      return {
        ...step,
        target: replacement.alternativeSelector,
      };
    }),
  };

  const proposal = await upsertAdaptiveWorkflow({
    organizationId: input.organizationId,
    workflowId: workflow.id,
    proposedDefinition: adaptedDefinition as Record<string, unknown>,
    notes: "Autonomy proposal generated from recurring selector failures.",
    applied: false,
  });

  return {
    proposal,
    selectorHistory,
  };
}

export async function fetchAutonomyStatus(input: { organizationId: string; workflowId: string }) {
  const [proposal, selectorHistory] = await Promise.all([
    getAdaptiveWorkflow(input),
    listSelectorAlternatives(input),
  ]);

  return {
    proposal,
    selectorHistory,
  };
}
