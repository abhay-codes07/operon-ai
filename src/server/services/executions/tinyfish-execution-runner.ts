import type { ExecutionStatus } from "@prisma/client";

import { RetryableOperationError, withRetry } from "@/lib/utils/retry";
import { executeTinyFishWorkflow, TinyFishApiError } from "@/server/integrations/tinyfish/client";
import { buildTinyFishExecutionRequest } from "@/server/integrations/tinyfish/request-builder";
import { parseTinyFishExecutionResponse } from "@/server/integrations/tinyfish/response-parser";
import { logInfo } from "@/server/observability/logger";
import { recordExecutionUsage } from "@/server/services/billing/usage-service";
import {
  captureExecutionDomSnapshot,
  persistExecutionReplaySteps,
} from "@/server/services/executions/replay-service";
import { persistScreenshotArtifact } from "@/server/services/storage/screenshot-storage";
import { fetchWorkflowById } from "@/server/services/workflows/workflow-service";

import {
  appendExecutionEvent,
  saveExecutionResult,
  setExecutionStatus,
} from "./execution-service";

type RunTinyFishExecutionInput = {
  organizationId: string;
  executionId: string;
  agentId: string;
  workflowId: string;
  traceId?: string;
};

type WorkflowDefinitionStep = {
  id: string;
  action: string;
  target: string;
  expectedOutcome: string;
};

function toReplayStepStatus(
  overallStatus: ExecutionStatus,
  stepIndex: number,
  totalSteps: number,
): "SUCCEEDED" | "FAILED" | "SKIPPED" {
  if (overallStatus === "SUCCEEDED") {
    return "SUCCEEDED";
  }

  if (overallStatus === "FAILED") {
    return stepIndex === totalSteps - 1 ? "FAILED" : "SUCCEEDED";
  }

  return "SKIPPED";
}

function shouldRetryTinyFishError(error: unknown): boolean {
  if (error instanceof TinyFishApiError) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }

  return error instanceof RetryableOperationError;
}

export async function runExecutionWithTinyFish(
  input: RunTinyFishExecutionInput,
): Promise<{ status: ExecutionStatus; providerExecutionId: string }> {
  const workflow = await fetchWorkflowById({
    organizationId: input.organizationId,
    workflowId: input.workflowId,
  });

  if (!workflow) {
    throw new Error("Workflow not found for organization");
  }

  await setExecutionStatus({
    organizationId: input.organizationId,
    executionId: input.executionId,
    status: "RUNNING",
  });

  await appendExecutionEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    level: "INFO",
    message: "TinyFish execution started",
    metadata: {
      traceId: input.traceId,
    },
  });

  const definition = workflow.definition;
  if (!definition || typeof definition !== "object") {
    throw new Error("Workflow definition is missing or invalid");
  }

  const request = buildTinyFishExecutionRequest({
    requestId: input.executionId,
    organizationId: input.organizationId,
    agentId: input.agentId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    definition: definition as {
      naturalLanguageTask: string;
      steps: WorkflowDefinitionStep[];
      guardrails: string[];
      timeoutSeconds: number;
      retryLimit: number;
    },
    metadata: {
      source: "webops-ai",
      traceId: input.traceId,
    },
  });

  const providerResponse = await withRetry(
    async () => {
      try {
        return await executeTinyFishWorkflow(request);
      } catch (error) {
        if (error instanceof TinyFishApiError && (error.statusCode >= 500 || error.statusCode === 429)) {
          throw new RetryableOperationError(error.message, true);
        }

        throw error;
      }
    },
    {
      maxAttempts: 3,
      baseDelayMs: 500,
      maxDelayMs: 4_000,
      shouldRetry: shouldRetryTinyFishError,
    },
  );

  const parsed = parseTinyFishExecutionResponse(providerResponse);

  const workflowSteps = (definition as { steps?: WorkflowDefinitionStep[] }).steps ?? [];
  const replaySteps = await persistExecutionReplaySteps({
    organizationId: input.organizationId,
    executionId: input.executionId,
    steps: workflowSteps.map((step, index) => ({
      stepIndex: index,
      stepKey: step.id,
      action: step.action,
      target: step.target,
      status: toReplayStepStatus(parsed.status, index, workflowSteps.length),
      metadata: {
        expectedOutcome: step.expectedOutcome,
        providerExecutionId: parsed.providerExecutionId,
      },
      startedAt: new Date(),
      finishedAt: new Date(),
    })),
  });

  for (const replayStep of replaySteps) {
    await captureExecutionDomSnapshot({
      organizationId: input.organizationId,
      executionId: input.executionId,
      executionStepId: replayStep.id,
      pageUrl: `https://replay.operon.ai/${input.executionId}/steps/${replayStep.stepIndex}`,
      domHtml: `<html><body><h1>Replay Snapshot</h1><p>Execution: ${input.executionId}</p><p>Step: ${replayStep.stepKey}</p><p>Action: ${replayStep.action}</p></body></html>`,
      metadata: {
        source: "tinyfish-replay-capture",
        traceId: input.traceId,
        stepStatus: replayStep.status,
      },
    });
  }

  for (const log of parsed.logs) {
    await appendExecutionEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      level: log.level,
      message: log.message,
      metadata: {
        source: "tinyfish",
        traceId: input.traceId,
        ...log.metadata,
      },
    });
  }

  const storedScreenshots = [] as Array<{ screenshotId: string; storagePath: string; mimeType: string }>;
  for (const screenshot of parsed.screenshots) {
    const stored = await persistScreenshotArtifact({
      organizationId: input.organizationId,
      executionId: input.executionId,
      screenshotId: screenshot.id,
      mimeType: screenshot.mimeType,
      base64Data: screenshot.base64Data,
    });
    storedScreenshots.push(stored);
  }

  await saveExecutionResult({
    organizationId: input.organizationId,
    executionId: input.executionId,
    outputPayload: {
      provider: "tinyfish",
      providerExecutionId: parsed.providerExecutionId,
      summary: parsed.summary,
      output: parsed.output,
      screenshots: storedScreenshots,
    },
    errorMessage: parsed.errorMessage,
  });

  await setExecutionStatus({
    organizationId: input.organizationId,
    executionId: input.executionId,
    status: parsed.status,
  });

  if (parsed.status === "SUCCEEDED") {
    await recordExecutionUsage(input.organizationId, 1);
  }

  await appendExecutionEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    level: parsed.status === "FAILED" ? "ERROR" : "INFO",
    message:
      parsed.status === "FAILED" ? "TinyFish execution failed" : "TinyFish execution completed",
    metadata: {
      providerExecutionId: parsed.providerExecutionId,
      status: parsed.status,
      traceId: input.traceId,
    },
  });

  logInfo("TinyFish execution completed", {
    component: "tinyfish-execution-runner",
    organizationId: input.organizationId,
    executionId: input.executionId,
    workflowId: input.workflowId,
    traceId: input.traceId,
    metadata: {
      status: parsed.status,
      providerExecutionId: parsed.providerExecutionId,
    },
  });

  return {
    status: parsed.status,
    providerExecutionId: parsed.providerExecutionId,
  };
}
