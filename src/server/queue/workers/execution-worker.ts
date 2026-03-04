import { QueueEvents, Worker } from "bullmq";

import {
  appendExecutionEvent,
  saveExecutionResult,
  setExecutionStatus,
} from "@/server/services/executions/execution-service";
import { logError, logInfo } from "@/server/observability/logger";
import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";
import { runExecutionWithTinyFish } from "@/server/services/executions/tinyfish-execution-runner";

import { getQueueRedisConnection } from "../connection";
import { executionJobName, type ExecutionJobData } from "../jobs/execution-job";
import { getQueueName } from "../names";
import { getExecutionQueue } from "../producers/execution-producer";

let executionWorker: Worker<ExecutionJobData> | null = null;
let executionQueueEvents: QueueEvents | null = null;

export function startExecutionWorker(): Worker<ExecutionJobData> {
  if (executionWorker) {
    return executionWorker;
  }

  const queueName = getQueueName("execution");
  executionWorker = new Worker<ExecutionJobData>(
    queueName,
    async (job) => {
      if (job.name !== executionJobName) {
        throw new Error(`Unsupported job name: ${job.name}`);
      }

      await appendExecutionEvent({
        organizationId: job.data.organizationId,
        executionId: job.data.executionId,
        level: "INFO",
        message: "Execution picked up by background worker",
        metadata: {
          attempt: job.attemptsMade + 1,
          queueJobId: job.id,
          traceId: job.data.traceId,
        },
      });

      await publishExecutionStreamEvent({
        organizationId: job.data.organizationId,
        executionId: job.data.executionId,
        eventType: "worker.picked",
        payload: {
          queueJobId: job.id,
          attempt: job.attemptsMade + 1,
        },
      });

      await runExecutionWithTinyFish({
        organizationId: job.data.organizationId,
        executionId: job.data.executionId,
        agentId: job.data.agentId,
        workflowId: job.data.workflowId,
        traceId: job.data.traceId,
      });
    },
    {
      connection: getQueueRedisConnection(),
      concurrency: 5,
    },
  );

  executionQueueEvents = new QueueEvents(queueName, {
    connection: getQueueRedisConnection(),
  });

  executionQueueEvents.on("failed", async ({ jobId, failedReason }) => {
    if (!jobId) {
      logError("Queue job failed without job id", {
        component: "execution-worker",
        metadata: { failedReason },
      });
      return;
    }

    const job = await getExecutionQueue().getJob(jobId);
    if (!job?.data) {
      logError("Queue job payload missing for failed event", {
        component: "execution-worker",
        executionId: jobId,
        metadata: { failedReason },
      });
      return;
    }

    logError("Queue job failed", {
      component: "execution-worker",
      executionId: job.data.executionId,
      organizationId: job.data.organizationId,
      traceId: job.data.traceId,
      metadata: {
        failedReason,
      },
    });

    const isFinalAttempt =
      typeof job.opts.attempts === "number" && job.attemptsMade >= job.opts.attempts;

    if (!isFinalAttempt) {
      return;
    }

    await setExecutionStatus({
      organizationId: job.data.organizationId,
      executionId: job.data.executionId,
      status: "FAILED",
    });

    await saveExecutionResult({
      organizationId: job.data.organizationId,
      executionId: job.data.executionId,
      errorMessage: failedReason,
    });

    await appendExecutionEvent({
      organizationId: job.data.organizationId,
      executionId: job.data.executionId,
      level: "ERROR",
      message: "Execution failed after queue retries were exhausted",
      metadata: {
        queueJobId: job.id,
        attemptsMade: job.attemptsMade,
        failedReason,
        traceId: job.data.traceId,
      },
    });

    await publishExecutionStreamEvent({
      organizationId: job.data.organizationId,
      executionId: job.data.executionId,
      eventType: "worker.failed",
      payload: {
        queueJobId: job.id,
        attemptsMade: job.attemptsMade,
        failedReason,
      },
    });
  });

  executionQueueEvents.on("completed", ({ jobId }) => {
    logInfo("Queue job completed", {
      component: "execution-worker",
      executionId: jobId ?? undefined,
    });
  });

  return executionWorker;
}

export async function stopExecutionWorker(): Promise<void> {
  if (executionQueueEvents) {
    await executionQueueEvents.close();
    executionQueueEvents = null;
  }

  if (executionWorker) {
    await executionWorker.close();
    executionWorker = null;
  }
}
