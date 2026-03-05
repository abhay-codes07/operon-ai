import type { ExecutionStatus } from "@prisma/client";

import { RetryableOperationError, withRetry } from "@/lib/utils/retry";
import { executeTinyFishWorkflow, TinyFishApiError } from "@/server/integrations/tinyfish/client";
import { buildTinyFishExecutionRequest } from "@/server/integrations/tinyfish/request-builder";
import { parseTinyFishExecutionResponse } from "@/server/integrations/tinyfish/response-parser";
import { logInfo } from "@/server/observability/logger";
import { prisma } from "@/server/db/client";
import { recordExecutionReliabilityMetric } from "@/server/services/agents/reliability-service";
import {
  applyPendingExecutionControlCommands,
  enqueueExecutionControlCommand,
} from "@/server/services/control-plane/execution-control-service";
import { ensureApprovalForStep } from "@/server/services/control-plane/approval-service";
import {
  isAgentExecutionEnabled,
} from "@/server/services/control-plane/system-flag-service";
import {
  publishExecutionStreamEvent,
} from "@/server/services/control-plane/streaming-service";
import {
  fetchAgentMemoryContext,
  rememberExecutionPattern,
} from "@/server/services/agents/memory-service";
import { recordExecutionUsage } from "@/server/services/billing/usage-service";
import { analyzeExecutionFailure } from "@/server/services/executions/failure-analysis-service";
import {
  fetchKnowledgeContextForExecution,
  ingestExecutionKnowledge,
} from "@/server/services/knowledge/knowledge-graph-service";
import { registerPageSnapshot } from "@/server/services/monitoring/change-radar-service";
import { registerSelectorFailure } from "@/server/services/workflows/autonomy-engine";
import { generateToolFromExecutionFailure } from "@/server/services/tools/tool-generation-service";
import { fetchInstalledTools } from "@/server/services/tools/tool-registry-service";
import { learnFromToolExecution } from "@/server/services/tools/tool-learning-engine";
import { recordAgentFleetStatus } from "@/server/services/mission-control/fleet-service";
import { detectExecutionAnomalies, detectIncident } from "@/server/services/mission-control/incident-detection-service";
import { executeRunbooksForIncident } from "@/server/services/mission-control/runbook-engine";
import {
  captureExecutionDomSnapshot,
  persistExecutionReplaySteps,
} from "@/server/services/executions/replay-service";
import {
  recordSelfHealingResolution,
  resolveSelectorWithFallback,
} from "@/server/services/executions/self-healing-service";
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
  const installedTools = await fetchInstalledTools({
    organizationId: input.organizationId,
    workflowId: workflow.id,
  }).catch(() => []);

  if (!(await isAgentExecutionEnabled())) {
    throw new Error("Agent execution disabled by global kill switch");
  }

  await setExecutionStatus({
    organizationId: input.organizationId,
    executionId: input.executionId,
    status: "RUNNING",
  });
  await recordAgentFleetStatus({
    organizationId: input.organizationId,
    agentId: input.agentId,
    status: "RUNNING",
    reason: "Execution started",
    metadata: {
      executionId: input.executionId,
    },
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

  if (installedTools.length > 0) {
    await appendExecutionEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      level: "INFO",
      message: "Installed tools attached to execution context",
      metadata: {
        toolCount: installedTools.length,
        tools: installedTools.map((item) => ({
          toolId: item.toolId,
          toolVersionId: item.toolVersionId,
          name: item.tool.name,
        })),
      },
    });
  }

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "execution.started",
    payload: {
      workflowId: workflow.id,
      traceId: input.traceId ?? null,
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
      memoryContext: await fetchAgentMemoryContext({
        organizationId: input.organizationId,
        agentId: input.agentId,
        workflowId: workflow.id,
      }),
      knowledgeContext: await fetchKnowledgeContextForExecution({
        organizationId: input.organizationId,
        stepTargets: ((definition as { steps?: WorkflowDefinitionStep[] }).steps ?? []).map(
          (step) => step.target,
        ),
      }),
      installedTools: installedTools.map((tool) => ({
        toolId: tool.toolId,
        toolVersionId: tool.toolVersionId,
        name: tool.tool.name,
      })),
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
      ...(() => {
        const healing = resolveSelectorWithFallback({
          requestedSelector: step.target,
          semanticHint: `${step.action} ${step.expectedOutcome}`,
          retryLimit: 2,
          candidates: [
            { selector: step.target },
            { selector: `[data-testid='${step.id}']`, semanticLabel: step.expectedOutcome },
            { selector: `[aria-label*='${step.action}']`, semanticLabel: step.action },
          ],
        });
        return {
          resolvedSelector: healing.resolvedSelector,
          healingStrategy: healing.strategy,
          healingScore: healing.similarityScore,
          healingAttempts: healing.attempts,
        };
      })(),
      stepIndex: index,
      stepKey: step.id,
      action: step.action,
      target: step.target,
      status: toReplayStepStatus(parsed.status, index, workflowSteps.length),
      metadata: {
        expectedOutcome: step.expectedOutcome,
        providerExecutionId: parsed.providerExecutionId,
        selfHealing: {
          strategy: resolveSelectorWithFallback({
            requestedSelector: step.target,
            semanticHint: `${step.action} ${step.expectedOutcome}`,
            retryLimit: 2,
            candidates: [
              { selector: step.target },
              { selector: `[data-testid='${step.id}']`, semanticLabel: step.expectedOutcome },
              { selector: `[aria-label*='${step.action}']`, semanticLabel: step.action },
            ],
          }),
        },
      },
      startedAt: new Date(),
      finishedAt: new Date(),
    })),
  });

  for (const replayStep of replaySteps) {
    await applyPendingExecutionControlCommands({
      organizationId: input.organizationId,
      executionId: input.executionId,
    });

    if (!(await isAgentExecutionEnabled())) {
      await enqueueExecutionControlCommand({
        organizationId: input.organizationId,
        executionId: input.executionId,
        action: "STOP",
        reason: "Global kill switch activated during execution",
      });
      throw new Error("Execution stopped by global kill switch");
    }

    const executionState = await prisma.execution.findUnique({
      where: {
        id: input.executionId,
      },
      select: {
        status: true,
        isPaused: true,
        stepCursor: true,
      },
    });

    if (executionState?.status === "CANCELED") {
      await publishExecutionStreamEvent({
        organizationId: input.organizationId,
        executionId: input.executionId,
        eventType: "execution.stopped",
        payload: {
          stepKey: replayStep.stepKey,
        },
      });
      throw new Error("Execution canceled by control command");
    }

    if (executionState?.isPaused && executionState.stepCursor < replayStep.stepIndex + 1) {
      await publishExecutionStreamEvent({
        organizationId: input.organizationId,
        executionId: input.executionId,
        eventType: "execution.paused",
        payload: {
          stepKey: replayStep.stepKey,
          stepIndex: replayStep.stepIndex,
        },
      });
      continue;
    }

    const healing = (replayStep.metadata?.selfHealing as
      | {
          resolvedSelector?: string;
          strategy?: string;
          similarityScore?: number;
          attempts?: Array<{ attempt: number; selector: string; score: number }>;
        }
      | undefined) ?? {
      resolvedSelector: replayStep.target ?? replayStep.stepKey,
      strategy: "selector-default",
      similarityScore: 0,
      attempts: [],
    };

    const approval = await ensureApprovalForStep({
      organizationId: input.organizationId,
      executionId: input.executionId,
      workflowId: workflow.id,
      stepKey: replayStep.stepKey,
      actionType: replayStep.action,
      actionPayload: {
        target: replayStep.target ?? null,
      },
    });
    if (!approval.approved) {
      await publishExecutionStreamEvent({
        organizationId: input.organizationId,
        executionId: input.executionId,
        eventType: "approval.pending",
        payload: {
          approvalRequestId: approval.request?.id ?? null,
          stepKey: replayStep.stepKey,
          action: replayStep.action,
        },
      });
      continue;
    }

    await recordSelfHealingResolution({
      organizationId: input.organizationId,
      executionId: input.executionId,
      executionStepId: replayStep.id,
      originalSelector: replayStep.target ?? undefined,
      resolvedSelector: healing.resolvedSelector ?? replayStep.target ?? replayStep.stepKey,
      strategy: healing.strategy ?? "selector-default",
      similarityScore: healing.similarityScore ?? 0,
      success: replayStep.status !== "FAILED",
      metadata: {
        attempts: healing.attempts ?? [],
      },
    });

    await publishExecutionStreamEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      eventType: "step.updated",
      payload: {
        stepKey: replayStep.stepKey,
        stepIndex: replayStep.stepIndex,
        status: replayStep.status,
      },
    });

    if (replayStep.status === "FAILED" && replayStep.target) {
      await registerSelectorFailure({
        organizationId: input.organizationId,
        workflowId: workflow.id,
        stepKey: replayStep.stepKey,
        originalSelector: replayStep.target,
        alternativeSelector: healing.resolvedSelector ?? replayStep.target,
        confidence: healing.similarityScore ?? 0,
      });
    }

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

    const targetUrl = replayStep.target?.startsWith("http")
      ? replayStep.target
      : `https://synthetic.operon.ai/${workflow.id}/step/${replayStep.stepIndex}`;

    await registerPageSnapshot({
      organizationId: input.organizationId,
      executionId: input.executionId,
      workflowId: workflow.id,
      url: targetUrl,
      domContent: `${replayStep.stepKey}:${replayStep.action}:${replayStep.status}`,
      snapshotRef: replayStep.id,
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

  const finalizedExecution = await setExecutionStatus({
    organizationId: input.organizationId,
    executionId: input.executionId,
    status: parsed.status,
  });

  if (parsed.status === "SUCCEEDED") {
    await recordExecutionUsage(input.organizationId, 1);
  }

  await rememberExecutionPattern({
    organizationId: input.organizationId,
    agentId: input.agentId,
    workflowId: workflow.id,
    executionId: input.executionId,
    status: parsed.status === "FAILED" ? "FAILED" : "SUCCEEDED",
    summary: parsed.summary,
    resolvedFailures:
      parsed.status === "FAILED"
        ? replaySteps
            .filter((item) => item.status === "FAILED")
            .map((item) => item.target ?? item.stepKey)
        : undefined,
  });

  const analysis =
    parsed.status === "FAILED"
      ? await analyzeExecutionFailure({
          organizationId: input.organizationId,
          executionId: input.executionId,
        })
      : null;

  if (parsed.status === "FAILED") {
    const signalType =
      analysis?.category === "SELECTOR_DRIFT"
        ? "SELECTOR_ERROR_LOOP"
        : analysis?.category === "PAGE_LOAD_TIMEOUT"
          ? "RETRY_LOOP"
          : "FAILURE_SPIKE";
    const incident = await detectIncident({
      organizationId: input.organizationId,
      signalType,
      title: `Execution failure detected for agent ${input.agentId.slice(-8)}`,
      description: analysis?.summary ?? parsed.errorMessage ?? "Execution failed without explicit provider message",
      severity: analysis?.category === "AUTHENTICATION_ISSUE" ? "CRITICAL" : "HIGH",
      agentId: input.agentId,
      executionId: input.executionId,
      metadata: {
        category: analysis?.category ?? "UNKNOWN",
        providerExecutionId: parsed.providerExecutionId,
      },
    });

    await executeRunbooksForIncident({
      organizationId: input.organizationId,
      triggerType: signalType,
      incidentId: incident.id,
      executionId: input.executionId,
      agentId: input.agentId,
    }).catch(() => []);
  }

  const anomalyIncidents = await detectExecutionAnomalies({
    organizationId: input.organizationId,
    executionId: input.executionId,
    agentId: input.agentId,
    logs: parsed.logs.map((item) => ({ message: item.message })),
    executionStatus: parsed.status,
  });
  for (const anomalyIncident of anomalyIncidents) {
    await executeRunbooksForIncident({
      organizationId: input.organizationId,
      triggerType: anomalyIncident.signalType,
      incidentId: anomalyIncident.id,
      executionId: input.executionId,
      agentId: input.agentId,
    }).catch(() => []);
  }

  await recordExecutionReliabilityMetric({
    organizationId: input.organizationId,
    executionId: input.executionId,
    agentId: input.agentId,
    startedAt: finalizedExecution.startedAt,
    finishedAt: finalizedExecution.finishedAt,
    isSuccess: parsed.status === "SUCCEEDED",
    retriesUsed: 0,
    failureCategory: analysis?.category,
  });

  await ingestExecutionKnowledge({
    organizationId: input.organizationId,
    agentId: input.agentId,
    executionId: input.executionId,
    workflowId: workflow.id,
    status: parsed.status === "FAILED" ? "FAILED" : "SUCCEEDED",
    stepTargets: workflowSteps.map((step) => step.target),
    failureCategory: analysis?.category,
  });

  if (parsed.status === "FAILED") {
    await generateToolFromExecutionFailure({
      organizationId: input.organizationId,
      agentId: input.agentId,
      executionId: input.executionId,
    }).catch(() => null);
  }

  for (const installation of installedTools) {
    await learnFromToolExecution({
      organizationId: input.organizationId,
      toolId: installation.toolId,
      status: parsed.status === "FAILED" ? "FAILED" : "SUCCEEDED",
      durationMs:
        finalizedExecution.startedAt && finalizedExecution.finishedAt
          ? finalizedExecution.finishedAt.getTime() - finalizedExecution.startedAt.getTime()
          : 0,
      executionId: input.executionId,
      errorMessage: parsed.errorMessage,
    }).catch(() => null);
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

  await recordAgentFleetStatus({
    organizationId: input.organizationId,
    agentId: input.agentId,
    status: parsed.status === "FAILED" ? "FAILED" : "IDLE",
    reason:
      parsed.status === "FAILED"
        ? "Execution ended with failure"
        : "Execution completed successfully",
    metadata: {
      executionId: input.executionId,
      providerExecutionId: parsed.providerExecutionId,
      status: parsed.status,
    },
  });

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: parsed.status === "FAILED" ? "execution.failed" : "execution.completed",
    payload: {
      status: parsed.status,
      providerExecutionId: parsed.providerExecutionId,
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
