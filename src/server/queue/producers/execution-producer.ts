import { Queue } from "bullmq";

import { getAppEnv } from "@/config/env";

import { getQueueRedisConnection } from "../connection";
import { executionJobName, type ExecutionJobData } from "../jobs/execution-job";
import { getQueueName } from "../names";

let executionQueue: Queue<any> | null = null;

export function getExecutionQueue(): Queue<any> {
  if (executionQueue) {
    return executionQueue;
  }

  executionQueue = new Queue(getQueueName("execution"), {
    connection: getQueueRedisConnection() as any,
  });

  return executionQueue;
}

export async function enqueueExecutionJob(data: ExecutionJobData): Promise<void> {
  const env = getAppEnv();
  const queue = getExecutionQueue();

  await queue.add(executionJobName, data, {
    jobId: data.executionId,
    attempts: env.BULLMQ_EXECUTION_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.BULLMQ_EXECUTION_BACKOFF_MS,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 500,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
      count: 2000,
    },
  });
}
