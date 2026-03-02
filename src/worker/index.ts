import { closeQueueRedisConnection } from "@/server/queue/connection";
import { startExecutionWorker, stopExecutionWorker } from "@/server/queue/workers/execution-worker";

async function bootstrapWorker() {
  console.log("Starting WebOps AI execution worker...");
  startExecutionWorker();

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down worker...`);
    await stopExecutionWorker();
    await closeQueueRedisConnection();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

void bootstrapWorker();
