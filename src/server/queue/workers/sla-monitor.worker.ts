import { calculateFailureRate, detectMissedSchedules } from "@/lib/sla/sla.service";
import { createSlaIncident } from "@/lib/sla/incident.service";
import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
let intervalHandle: NodeJS.Timeout | null = null;

async function checkFailureRates() {
  const slas = await prisma.workflowSLA.findMany({
    include: {
      workflow: {
        select: { id: true, organizationId: true },
      },
    },
  });

  for (const sla of slas) {
    const rate = await calculateFailureRate(sla.workflowId, sla.rollingWindowDays);
    if (rate > sla.maxFailureRate) {
      await createSlaIncident({
        organizationId: sla.workflow.organizationId,
        workflowId: sla.workflowId,
        breachType: "FAILURE_RATE",
        breachDetails: {
          observedFailureRate: rate,
          maxFailureRate: sla.maxFailureRate,
          rollingWindowDays: sla.rollingWindowDays,
        },
      });
    }
  }
}

async function checkExecutionTimeouts() {
  const recentRuns = await prisma.execution.findMany({
    where: {
      status: { in: ["FAILED", "SUCCEEDED", "CANCELED"] },
      finishedAt: {
        gte: new Date(Date.now() - FIVE_MINUTES_MS),
      },
      workflowId: { not: null },
    },
    select: {
      id: true,
      workflowId: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  for (const run of recentRuns) {
    if (!run.workflowId || !run.startedAt || !run.finishedAt) {
      continue;
    }
    const sla = await prisma.workflowSLA.findUnique({
      where: { workflowId: run.workflowId },
      include: {
        workflow: { select: { organizationId: true } },
      },
    });
    if (!sla) {
      continue;
    }

    const seconds = Math.max(0, Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000));
    if (seconds <= sla.maxExecutionTimeSeconds) {
      continue;
    }

    await createSlaIncident({
      organizationId: sla.workflow.organizationId,
      workflowId: run.workflowId,
      runId: run.id,
      breachType: "EXECUTION_TIMEOUT",
      breachDetails: {
        observedSeconds: seconds,
        thresholdSeconds: sla.maxExecutionTimeSeconds,
      },
    });
  }
}

async function checkSchedules() {
  const slas = await prisma.workflowSLA.findMany({
    select: { workflowId: true },
  });

  for (const sla of slas) {
    await detectMissedSchedules(sla.workflowId);
  }
}

async function runSlaMonitorCycle() {
  try {
    await checkFailureRates();
    await checkExecutionTimeouts();
    await checkSchedules();
    logInfo("SLA monitor cycle completed", {
      component: "sla-monitor-worker",
    });
  } catch (error) {
    logError("SLA monitor cycle failed", {
      component: "sla-monitor-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startSlaMonitorWorker() {
  if (intervalHandle) {
    return;
  }
  void runSlaMonitorCycle();
  intervalHandle = setInterval(() => {
    void runSlaMonitorCycle();
  }, FIVE_MINUTES_MS);
}

export async function stopSlaMonitorWorker() {
  if (!intervalHandle) {
    return;
  }
  clearInterval(intervalHandle);
  intervalHandle = null;
}
