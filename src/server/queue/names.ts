import { getAppEnv } from "@/config/env";

export const queueNames = {
  execution: "execution-jobs",
} as const;

export function getQueueName(key: keyof typeof queueNames): string {
  const env = getAppEnv();
  return `${env.BULLMQ_QUEUE_PREFIX}:${queueNames[key]}`;
}
