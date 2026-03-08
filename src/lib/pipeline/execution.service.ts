import { prisma } from "@/server/db/client";
import { enqueueExecutionJob } from "@/server/queue/producers/execution-producer";
import { createTraceId } from "@/server/observability/tracing";
import { queueExecution } from "@/server/services/executions/execution-service";
import { logPipelineAuditEvent } from "@/lib/pipeline/audit.service";
import { recordPipelineRuntimeCost } from "@/lib/finops/cost-tracker.service";
import {
  buildStepInputFromContext,
  mergeStepOutputIntoContext,
  serializeAgentOutput,
  type JsonRecord,
} from "@/lib/pipeline/data-transfer";

type PipelineRunWithSteps = Awaited<ReturnType<typeof fetchPipelineRunWithDetails>>;

export async function createPipelineRun(input: {
  pipelineId: string;
  orgId: string;
  inputPayload?: Record<string, unknown>;
}) {
  return prisma.pipelineRun.create({
    data: {
      pipelineId: input.pipelineId,
      orgId: input.orgId,
      status: "RUNNING",
      inputPayload: input.inputPayload ?? {},
      contextPayload: input.inputPayload ?? {},
    },
  });
}

async function fetchPipelineRunWithDetails(pipelineRunId: string, orgId: string) {
  return prisma.pipelineRun.findFirst({
    where: {
      id: pipelineRunId,
      orgId,
    },
    include: {
      pipeline: {
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      },
      stepRuns: {
        include: {
          step: true,
          agentRun: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

function evaluateStepCondition(
  inputMapping: Record<string, unknown>,
  context: JsonRecord,
): boolean {
  const when = inputMapping.when;
  if (!when || typeof when !== "object") {
    return true;
  }

  const descriptor = when as { key?: string; equals?: unknown };
  if (!descriptor.key) {
    return true;
  }
  return context[descriptor.key] === descriptor.equals;
}

async function resolveWorkflowForPipelineStep(orgId: string, agentId: string) {
  return prisma.workflow.findFirst({
    where: {
      organizationId: orgId,
      agentId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      agentId: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function dispatchStepExecution(input: {
  orgId: string;
  pipelineRunId: string;
  stepId: string;
  stepOrder: number;
  agentId: string;
  stepInput: JsonRecord;
}) {
  const workflow = await resolveWorkflowForPipelineStep(input.orgId, input.agentId);
  if (!workflow) {
    throw new Error(`No active workflow found for agent ${input.agentId}`);
  }

  const execution = await queueExecution({
    organizationId: input.orgId,
    agentId: workflow.agentId,
    workflowId: workflow.id,
    trigger: "API",
    inputPayload: {
      source: "operon-pipeline",
      pipelineRunId: input.pipelineRunId,
      pipelineStepId: input.stepId,
      pipelineStepOrder: input.stepOrder,
      stepInput: input.stepInput,
    },
  });

  await prisma.pipelineStepRun.update({
    where: { id: input.stepId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      agentRunId: execution.id,
      inputPayload: input.stepInput,
    },
  });

  const traceId = createTraceId(execution.id);
  await enqueueExecutionJob({
    organizationId: input.orgId,
    executionId: execution.id,
    workflowId: workflow.id,
    agentId: workflow.agentId,
    trigger: "API",
    traceId,
  });

  return execution;
}

async function markPipelineAsFailed(input: {
  pipelineRunId: string;
  orgId: string;
  pipelineId: string;
  message: string;
  agentId?: string;
}) {
  await prisma.pipelineRun.update({
    where: { id: input.pipelineRunId },
    data: {
      status: "PAUSED",
      errorMessage: input.message,
    },
  });

  await logPipelineAuditEvent({
    orgId: input.orgId,
    pipelineId: input.pipelineId,
    eventType: "PIPELINE_FAILED",
    message: input.message,
    agentId: input.agentId,
    metadata: { pipelineRunId: input.pipelineRunId },
  });
}

async function advanceAfterStepCompletion(run: PipelineRunWithSteps, stepRunId: string) {
  const refreshed = await fetchPipelineRunWithDetails(run.id, run.orgId);
  if (!refreshed || refreshed.status !== "RUNNING") {
    return refreshed;
  }

  const lastStepRun = refreshed.stepRuns.find((stepRun) => stepRun.id === stepRunId);
  const nextStep = refreshed.pipeline.steps.find(
    (step) => step.stepOrder > (lastStepRun?.step.stepOrder ?? 0),
  );

  if (!nextStep) {
    const completedAt = new Date();
    const startedAt = refreshed.startedAt;
    const elapsedSeconds = Math.max(0, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000));
    await prisma.pipelineRun.update({
      where: { id: refreshed.id },
      data: {
        status: "COMPLETED",
        completedAt,
        errorMessage: null,
      },
    });
    await recordPipelineRuntimeCost(refreshed.id, null, elapsedSeconds).catch(() => null);
    return refreshed;
  }

  await prisma.pipelineStepRun.create({
    data: {
      pipelineRunId: refreshed.id,
      stepId: nextStep.id,
      orgId: refreshed.orgId,
      status: "QUEUED",
    },
  });

  return refreshed;
}

export async function processPipelineRunTick(pipelineRunId: string, orgId: string) {
  const run = await fetchPipelineRunWithDetails(pipelineRunId, orgId);
  if (!run || run.status !== "RUNNING") {
    return run;
  }

  const context = ((run.contextPayload as JsonRecord | null) ?? {}) as JsonRecord;

  if (run.stepRuns.length === 0) {
    const firstStep = run.pipeline.steps[0];
    if (!firstStep) {
      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      return run;
    }

    await prisma.pipelineStepRun.create({
      data: {
        pipelineRunId: run.id,
        stepId: firstStep.id,
        orgId: run.orgId,
        status: "QUEUED",
      },
    });
    return run;
  }

  const currentStepRun = run.stepRuns[run.stepRuns.length - 1];
  const stepInputMapping = (currentStepRun.step.inputMapping as JsonRecord | null) ?? {};

  if (!evaluateStepCondition(stepInputMapping, context)) {
    await prisma.pipelineStepRun.update({
      where: { id: currentStepRun.id },
      data: {
        status: "SKIPPED",
        startedAt: currentStepRun.startedAt ?? new Date(),
        completedAt: new Date(),
      },
    });
    await advanceAfterStepCompletion(run, currentStepRun.id);
    return run;
  }

  if (currentStepRun.status === "QUEUED") {
    const stepInput = buildStepInputFromContext(
      ((run.inputPayload as JsonRecord | null) ?? {}) as JsonRecord,
      context,
      stepInputMapping as { inject?: Record<string, string> },
    );

    try {
      await dispatchStepExecution({
        orgId: run.orgId,
        pipelineRunId: run.id,
        stepId: currentStepRun.id,
        stepOrder: currentStepRun.step.stepOrder,
        agentId: currentStepRun.step.agentId,
        stepInput,
      });
      return run;
    } catch (error) {
      await markPipelineAsFailed({
        pipelineRunId: run.id,
        orgId: run.orgId,
        pipelineId: run.pipelineId,
        message: error instanceof Error ? error.message : "Pipeline step dispatch failed",
        agentId: currentStepRun.step.agentId,
      });
      return run;
    }
  }

  if (currentStepRun.status === "RUNNING" && currentStepRun.agentRunId && currentStepRun.agentRun) {
    const executionStatus = currentStepRun.agentRun.status;
    if (executionStatus === "SUCCEEDED") {
      const stepOutput = serializeAgentOutput(currentStepRun.agentRun.outputPayload);
      const outputMapping = (currentStepRun.step.outputMapping as JsonRecord | null) ?? {};
      const mergedContext = mergeStepOutputIntoContext(
        context,
        stepOutput,
        outputMapping as { expose?: Record<string, string> },
      );

      await prisma.pipelineStepRun.update({
        where: { id: currentStepRun.id },
        data: {
          status: "SUCCEEDED",
          completedAt: new Date(),
          outputPayload: stepOutput,
          errorMessage: null,
        },
      });

      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          contextPayload: mergedContext,
          errorMessage: null,
        },
      });

      await logPipelineAuditEvent({
        orgId: run.orgId,
        pipelineId: run.pipelineId,
        eventType: "PIPELINE_STEP_COMPLETED",
        message: `Pipeline step ${currentStepRun.step.stepOrder} completed`,
        agentId: currentStepRun.step.agentId,
        metadata: {
          pipelineRunId: run.id,
          pipelineStepRunId: currentStepRun.id,
          agentRunId: currentStepRun.agentRunId,
        },
      });

      await advanceAfterStepCompletion(run, currentStepRun.id);
      return run;
    }

    if (executionStatus === "FAILED" || executionStatus === "CANCELED") {
      await prisma.pipelineStepRun.update({
        where: { id: currentStepRun.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: currentStepRun.agentRun.errorMessage ?? "Agent run failed",
        },
      });

      await markPipelineAsFailed({
        pipelineRunId: run.id,
        orgId: run.orgId,
        pipelineId: run.pipelineId,
        message:
          currentStepRun.agentRun.errorMessage ??
          `Pipeline step ${currentStepRun.step.stepOrder} failed`,
        agentId: currentStepRun.step.agentId,
      });
      return run;
    }
  }

  return run;
}

export async function pausePipelineRun(pipelineRunId: string, orgId: string) {
  return prisma.pipelineRun.updateMany({
    where: {
      id: pipelineRunId,
      orgId,
      status: "RUNNING",
    },
    data: {
      status: "PAUSED",
    },
  });
}

export async function resumePipelineRun(pipelineRunId: string, orgId: string) {
  return prisma.pipelineRun.updateMany({
    where: {
      id: pipelineRunId,
      orgId,
      status: "PAUSED",
    },
    data: {
      status: "RUNNING",
      errorMessage: null,
    },
  });
}

export async function retryPipelineStepRun(input: {
  orgId: string;
  pipelineRunId: string;
  stepRunId: string;
}) {
  const stepRun = await prisma.pipelineStepRun.findFirst({
    where: {
      id: input.stepRunId,
      pipelineRunId: input.pipelineRunId,
      orgId: input.orgId,
    },
    include: {
      step: true,
      pipelineRun: true,
    },
  });
  if (!stepRun) {
    return null;
  }

  await prisma.pipelineRun.update({
    where: { id: input.pipelineRunId },
    data: {
      status: "RUNNING",
      errorMessage: null,
    },
  });

  return prisma.pipelineStepRun.update({
    where: { id: stepRun.id },
    data: {
      status: "QUEUED",
      retryCount: stepRun.retryCount + 1,
      startedAt: null,
      completedAt: null,
      agentRunId: null,
      errorMessage: null,
    },
  });
}

export async function skipPipelineStepRun(input: {
  orgId: string;
  pipelineRunId: string;
  stepRunId: string;
}) {
  const stepRun = await prisma.pipelineStepRun.findFirst({
    where: {
      id: input.stepRunId,
      pipelineRunId: input.pipelineRunId,
      orgId: input.orgId,
    },
  });
  if (!stepRun) {
    return null;
  }

  await prisma.pipelineRun.update({
    where: { id: input.pipelineRunId },
    data: {
      status: "RUNNING",
      errorMessage: null,
    },
  });

  return prisma.pipelineStepRun.update({
    where: { id: stepRun.id },
    data: {
      status: "SKIPPED",
      completedAt: new Date(),
    },
  });
}
