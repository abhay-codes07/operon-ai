import {
  createDomSnapshot,
  listDomSnapshots,
  listExecutionSteps,
  replaceExecutionSteps,
} from "@/server/repositories/executions/replay-repository";

export async function persistExecutionReplaySteps(input: {
  organizationId: string;
  executionId: string;
  steps: Array<{
    stepIndex: number;
    stepKey: string;
    action: string;
    target?: string;
    status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
    metadata?: Record<string, unknown>;
    startedAt?: Date;
    finishedAt?: Date;
  }>;
}) {
  return replaceExecutionSteps(input);
}

export async function captureExecutionDomSnapshot(input: {
  organizationId: string;
  executionId: string;
  executionStepId?: string;
  pageUrl?: string;
  domHtml: string;
  metadata?: Record<string, unknown>;
}) {
  return createDomSnapshot(input);
}

export async function fetchExecutionReplay(input: { organizationId: string; executionId: string }) {
  const [steps, snapshots] = await Promise.all([
    listExecutionSteps(input.organizationId, input.executionId),
    listDomSnapshots(input.organizationId, input.executionId),
  ]);

  return {
    executionId: input.executionId,
    steps,
    snapshots,
  };
}
