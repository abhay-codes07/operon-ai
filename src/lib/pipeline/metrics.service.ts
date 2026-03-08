import { prisma } from "@/server/db/client";

export async function getPipelineStats(orgId: string) {
  const [totalPipelines, totalRuns, runningRuns, pausedRuns, failedRuns, completedRuns] =
    await Promise.all([
      prisma.pipeline.count({ where: { orgId } }),
      prisma.pipelineRun.count({ where: { orgId } }),
      prisma.pipelineRun.count({ where: { orgId, status: "RUNNING" } }),
      prisma.pipelineRun.count({ where: { orgId, status: "PAUSED" } }),
      prisma.pipelineRun.count({ where: { orgId, status: "FAILED" } }),
      prisma.pipelineRun.count({ where: { orgId, status: "COMPLETED" } }),
    ]);

  return {
    totalPipelines,
    totalRuns,
    runningRuns,
    pausedRuns,
    failedRuns,
    completedRuns,
  };
}
