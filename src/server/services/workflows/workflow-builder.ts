import { createHash } from "node:crypto";

import type { WorkflowDefinition, WorkflowStep } from "@/modules/workflows/contracts";

function splitNaturalLanguageTask(task: string): string[] {
  return task
    .split(/\.|\n|\;/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

function toStep(statement: string, index: number, fallbackTargetUrl: string): WorkflowStep {
  const normalized = statement.replace(/\s+/g, " ").trim();
  const digest = createHash("sha1").update(`${index}:${normalized}`).digest("hex").slice(0, 8);
  const targetUrl = extractFirstUrl(normalized) ?? fallbackTargetUrl;

  return {
    id: `step_${digest}`,
    action: normalized,
    target: targetUrl,
    expectedOutcome: "Step completes successfully",
  };
}

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

function normalizeTargetUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = [trimmed, `https://${trimmed}`];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString();
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

export function buildWorkflowDefinition(input: {
  naturalLanguageTask: string;
  targetUrl?: string;
  guardrails: string[];
  timeoutSeconds: number;
  retryLimit: number;
}): WorkflowDefinition {
  const statements = splitNaturalLanguageTask(input.naturalLanguageTask);
  const fallbackTargetUrl = normalizeTargetUrl(input.targetUrl) ?? "https://example.com";
  const steps = (statements.length > 0 ? statements : [input.naturalLanguageTask]).map((statement, index) =>
    toStep(statement, index + 1, fallbackTargetUrl),
  );

  return {
    naturalLanguageTask: input.naturalLanguageTask,
    steps,
    guardrails: input.guardrails,
    timeoutSeconds: input.timeoutSeconds,
    retryLimit: input.retryLimit,
  };
}
