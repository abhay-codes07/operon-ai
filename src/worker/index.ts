import { closeQueueRedisConnection } from "@/server/queue/connection";
import {
  startMarketplaceReliabilityWorker,
  stopMarketplaceReliabilityWorker,
} from "@/server/queue/workers/marketplace-reliability.worker";
import { startSlaMonitorWorker, stopSlaMonitorWorker } from "@/server/queue/workers/sla-monitor.worker";
import { startExecutionWorker, stopExecutionWorker } from "@/server/queue/workers/execution-worker";
import {
  startComplianceReportWorker,
  stopComplianceReportWorker,
} from "@/server/queue/workers/compliance-report.worker";
import {
  startPipelineRunnerWorker,
  stopPipelineRunnerWorker,
} from "@/server/queue/workers/pipeline-runner.worker";
import {
  startCostMonitorWorker,
  stopCostMonitorWorker,
} from "@/server/queue/workers/cost-monitor.worker";
import {
  startIntelligenceMonitorWorker,
  stopIntelligenceMonitorWorker,
} from "@/server/queue/workers/intelligence-monitor.worker";
import {
  startShieldMonitorWorker,
  stopShieldMonitorWorker,
} from "@/server/queue/workers/shield-monitor.worker";
import {
  startAutopilotMemoryWorker,
  stopAutopilotMemoryWorker,
} from "@/server/queue/workers/autopilot-memory.worker";

async function bootstrapWorker() {
  console.log("Starting WebOps AI execution worker...");
  startExecutionWorker();
  startMarketplaceReliabilityWorker();
  startSlaMonitorWorker();
  startComplianceReportWorker();
  startPipelineRunnerWorker();
  startCostMonitorWorker();
  startIntelligenceMonitorWorker();
  startShieldMonitorWorker();
  startAutopilotMemoryWorker();

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down worker...`);
    await stopExecutionWorker();
    await stopMarketplaceReliabilityWorker();
    await stopSlaMonitorWorker();
    await stopComplianceReportWorker();
    await stopPipelineRunnerWorker();
    await stopCostMonitorWorker();
    await stopIntelligenceMonitorWorker();
    await stopShieldMonitorWorker();
    await stopAutopilotMemoryWorker();
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
