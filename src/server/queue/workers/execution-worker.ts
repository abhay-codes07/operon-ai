import { QueueEvents, Worker } from "bullmq";

import { appendExecutionEvent } from "@/server/services/executions/execution-service";
import { runExecutionWithTinyFish } from "@/server/services/executions/tinyfish-execution-runner";

import { getQueueRedisConnection } from "../connection";
import { executionJobName, type ExecutionJobData } from "../jobs/execution-job";
import { getQueueName } from "../names";

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
        },
      });

      await runExecutionWithTinyFish({
        organizationId: job.data.organizationId,
        executionId: job.data.executionId,
        agentId: job.data.agentId,
        workflowId: job.data.workflowId,
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

  executionQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error("[queue:execution] job failed", { jobId, failedReason });
  });

  executionQueueEvents.on("completed", ({ jobId }) => {
    console.log("[queue:execution] job completed", { jobId });
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
