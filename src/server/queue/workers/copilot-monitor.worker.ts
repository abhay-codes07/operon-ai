import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const COPILOT_MONITOR_MS = 60_000;
let intervalHandle: NodeJS.Timeout | null = null;

async function runCoPilotMonitorCycle() {
  try {
    const staleCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const staleSessions = await prisma.coPilotSession.findMany({
      where: {
        endedAt: null,
        startedAt: {
          lt: staleCutoff,
        },
      },
      select: { id: true },
      take: 200,
    });

    if (staleSessions.length > 0) {
      await prisma.coPilotSession.updateMany({
        where: {
          id: {
            in: staleSessions.map((session) => session.id),
          },
        },
        data: {
          endedAt: new Date(),
        },
      });
    }

    logInfo("Co-Pilot monitor cycle completed", {
      component: "copilot-monitor-worker",
      metadata: {
        staleSessionsClosed: staleSessions.length,
      },
    });
  } catch (error) {
    logError("Co-Pilot monitor cycle failed", {
      component: "copilot-monitor-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startCoPilotMonitorWorker() {
  if (intervalHandle) {
    return;
  }
  void runCoPilotMonitorCycle();
  intervalHandle = setInterval(() => {
    void runCoPilotMonitorCycle();
  }, COPILOT_MONITOR_MS);
}

export async function stopCoPilotMonitorWorker() {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
}
