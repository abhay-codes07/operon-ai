import { processPipelineRunTick } from "@/lib/pipeline/execution.service";
import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const PIPELINE_TICK_MS = 5_000;

let intervalHandle: NodeJS.Timeout | null = null;

async function runPipelineTickCycle() {
  try {
    const runs = await prisma.pipelineRun.findMany({
      where: {
        status: "RUNNING",
      },
      select: {
        id: true,
        orgId: true,
      },
      orderBy: { startedAt: "asc" },
      take: 100,
    });

    for (const run of runs) {
      await processPipelineRunTick(run.id, run.orgId);
    }

    if (runs.length > 0) {
      logInfo("Pipeline runner cycle completed", {
        component: "pipeline-runner-worker",
        metadata: {
          runningPipelines: runs.length,
        },
      });
    }
  } catch (error) {
    logError("Pipeline runner cycle failed", {
      component: "pipeline-runner-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startPipelineRunnerWorker() {
  if (intervalHandle) {
    return;
  }

  void runPipelineTickCycle();
  intervalHandle = setInterval(() => {
    void runPipelineTickCycle();
  }, PIPELINE_TICK_MS);
}

export async function stopPipelineRunnerWorker() {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
}
