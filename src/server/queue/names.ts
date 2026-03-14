import { getAppEnv } from "@/config/env";

export const queueNames = {
  execution: "execution-jobs",
} as const;

export function getQueueName(key: keyof typeof queueNames): string {
  const env = getAppEnv();
  // BullMQ v5 disallows ":" in queue names.
  const safePrefix = env.BULLMQ_QUEUE_PREFIX.replace(/[:\s]+/g, "-");
  return `${safePrefix}-${queueNames[key]}`;
}
