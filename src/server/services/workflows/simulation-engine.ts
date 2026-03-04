import {
  createWorkflowSimulation,
  listWorkflowSimulations,
} from "@/server/repositories/workflows/simulation-repository";

type WorkflowStep = {
  id?: string;
  action?: string;
  target?: string;
  expectedOutcome?: string;
};

function isLikelySelector(value: string) {
  return /^(\.|#|\[|\/\/|[a-z])/i.test(value);
}

export async function simulateWorkflowExecution(input: {
  organizationId: string;
  workflowId: string;
  requestedById?: string;
  steps: WorkflowStep[];
}) {
  const predictedPath = input.steps.map((step, index) => {
    const selectorValid = step.target ? isLikelySelector(step.target) : false;
    return {
      order: index + 1,
      stepId: step.id ?? `step-${index + 1}`,
      action: step.action ?? "unknown",
      target: step.target ?? null,
      expectedOutcome: step.expectedOutcome ?? null,
      selectorValid,
    };
  });

  const warnings = predictedPath.flatMap((step) => {
    const stepWarnings: string[] = [];
    if (!step.target) {
      stepWarnings.push(`Step ${step.order} is missing target`);
    } else if (!step.selectorValid) {
      stepWarnings.push(`Step ${step.order} has an invalid selector format`);
    }

    if (step.action === "unknown") {
      stepWarnings.push(`Step ${step.order} has no explicit action`);
    }

    return stepWarnings;
  });

  const status = warnings.length > 0 ? "FAILED" : "READY";

  return createWorkflowSimulation({
    organizationId: input.organizationId,
    workflowId: input.workflowId,
    requestedById: input.requestedById,
    status,
    predictedPath: predictedPath as Array<Record<string, unknown>>,
    warnings,
  });
}

export async function fetchRecentWorkflowSimulations(input: {
  organizationId: string;
  workflowId: string;
}) {
  return listWorkflowSimulations(input);
}
