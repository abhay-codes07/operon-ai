import { prisma } from "@/server/db/client";

import { createSlaIncident } from "@/lib/sla/incident.service";

function toFailureRate(total: number, failed: number): number {
  if (total === 0) {
    return 0;
  }
  return failed / total;
}

function cronLikelyMissed(lastRunAt: Date | null, cron: string): boolean {
  if (!lastRunAt) {
    return true;
  }

  // Lightweight schedule heuristic for monitor loop.
  const now = Date.now();
  const elapsedMs = now - lastRunAt.getTime();
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }

  if (parts[0].startsWith("*/")) {
    const intervalMinutes = Number(parts[0].slice(2));
    if (!Number.isNaN(intervalMinutes) && intervalMinutes > 0) {
      return elapsedMs > intervalMinutes * 60 * 1000 * 2;
    }
  }

  if (parts[0] === "0") {
    return elapsedMs > 2 * 60 * 60 * 1000;
  }

  return elapsedMs > 24 * 60 * 60 * 1000;
}

export async function createWorkflowSLA(
  workflowId: string,
  config: {
    expectedSchedule: string;
    maxFailureRate: number;
    maxExecutionTimeSeconds: number;
    rollingWindowDays: number;
    notificationSlackChannel?: string;
    notificationEmail?: string;
    escalationAfterBreaches?: number;
  },
) {
  return prisma.workflowSLA.upsert({
    where: { workflowId },
    create: {
      workflowId,
      expectedSchedule: config.expectedSchedule,
      maxFailureRate: config.maxFailureRate,
      maxExecutionTimeSeconds: config.maxExecutionTimeSeconds,
      rollingWindowDays: config.rollingWindowDays,
      notificationSlackChannel: config.notificationSlackChannel,
      notificationEmail: config.notificationEmail,
      escalationAfterBreaches: config.escalationAfterBreaches ?? 3,
    },
    update: {
      expectedSchedule: config.expectedSchedule,
      maxFailureRate: config.maxFailureRate,
      maxExecutionTimeSeconds: config.maxExecutionTimeSeconds,
      rollingWindowDays: config.rollingWindowDays,
      notificationSlackChannel: config.notificationSlackChannel,
      notificationEmail: config.notificationEmail,
      escalationAfterBreaches: config.escalationAfterBreaches ?? 3,
    },
  });
}

export async function calculateFailureRate(workflowId: string, windowDays: number): Promise<number> {
  const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const grouped = await prisma.execution.groupBy({
    by: ["status"],
    where: {
      workflowId,
      createdAt: { gte: from },
    },
    _count: {
      _all: true,
    },
  });
  const total = grouped.reduce((acc, row) => acc + row._count._all, 0);
  const failed = grouped
    .filter((row) => row.status === "FAILED" || row.status === "CANCELED")
    .reduce((acc, row) => acc + row._count._all, 0);

  return toFailureRate(total, failed);
}

export async function detectExecutionTimeout(run: {
  id: string;
  workflowId: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}) {
  if (!run.workflowId || !run.startedAt || !run.finishedAt) {
    return null;
  }

  const sla = await prisma.workflowSLA.findUnique({
    where: { workflowId: run.workflowId },
    include: {
      workflow: { select: { organizationId: true } },
    },
  });
  if (!sla) {
    return null;
  }

  const seconds = Math.max(0, Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000));
  if (seconds <= sla.maxExecutionTimeSeconds) {
    return null;
  }

  return createSlaIncident({
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

export async function detectMissedSchedules(workflowId: string) {
  const sla = await prisma.workflowSLA.findUnique({
    where: { workflowId },
    include: { workflow: { select: { id: true, organizationId: true } } },
  });
  if (!sla) {
    return null;
  }

  const lastRun = await prisma.execution.findFirst({
    where: { workflowId: sla.workflowId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const missed = cronLikelyMissed(lastRun?.createdAt ?? null, sla.expectedSchedule);
  if (!missed) {
    return null;
  }

  return createSlaIncident({
    organizationId: sla.workflow.organizationId,
    workflowId: workflowId,
    breachType: "MISSED_SCHEDULE",
    breachDetails: {
      expectedSchedule: sla.expectedSchedule,
      lastRunAt: lastRun?.createdAt?.toISOString() ?? null,
    },
  });
}

export async function evaluateRunAgainstSLA(run: {
  id: string;
  workflowId: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}) {
  const timeoutIncident = await detectExecutionTimeout(run);
  let failureRateIncident: unknown = null;
  if (run.workflowId) {
    const sla = await prisma.workflowSLA.findUnique({
      where: { workflowId: run.workflowId },
      include: { workflow: { select: { organizationId: true } } },
    });
    if (sla) {
      const rate = await calculateFailureRate(run.workflowId, sla.rollingWindowDays);
      if (rate > sla.maxFailureRate) {
        failureRateIncident = await createSlaIncident({
          organizationId: sla.workflow.organizationId,
          workflowId: run.workflowId,
          runId: run.id,
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
  return {
    timeoutIncident,
    failureRateIncident,
  };
}
