import { createHash } from "node:crypto";

import type { WorkflowDefinition, WorkflowStep } from "@/modules/workflows/contracts";

function splitNaturalLanguageTask(task: string): string[] {
  return task
    .split(/\.|\n|\;/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

function toStep(statement: string, index: number): WorkflowStep {
  const normalized = statement.replace(/\s+/g, " ").trim();
  const digest = createHash("sha1").update(`${index}:${normalized}`).digest("hex").slice(0, 8);

  return {
    id: `step_${digest}`,
    action: normalized,
    target: "website",
    expectedOutcome: "Step completes successfully",
  };
}

export function buildWorkflowDefinition(input: {
  naturalLanguageTask: string;
  guardrails: string[];
  timeoutSeconds: number;
  retryLimit: number;
}): WorkflowDefinition {
  const statements = splitNaturalLanguageTask(input.naturalLanguageTask);
  const steps = (statements.length > 0 ? statements : [input.naturalLanguageTask]).map((statement, index) =>
    toStep(statement, index + 1),
  );

  return {
    naturalLanguageTask: input.naturalLanguageTask,
    steps,
    guardrails: input.guardrails,
    timeoutSeconds: input.timeoutSeconds,
    retryLimit: input.retryLimit,
  };
}
