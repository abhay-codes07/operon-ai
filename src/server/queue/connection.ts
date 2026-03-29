import IORedis from "ioredis";

import { getAppEnv } from "@/config/env";

let redisConnection: IORedis | null = null;

export function getQueueRedisConnection(): any {
  if (redisConnection) {
    return redisConnection;
  }

  const env = getAppEnv();
  redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: () => null,
  });

  // Prevent unhandled error events
  redisConnection.on("error", () => null);

  return redisConnection;
}

export async function closeQueueRedisConnection(): Promise<void> {
  if (!redisConnection) {
    return;
  }

  await redisConnection.quit();
  redisConnection = null;
}
