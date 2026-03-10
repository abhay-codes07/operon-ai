import { scanDomContent } from "@/lib/shield/injection-detector.service";
import { logPromptInjectionEvent } from "@/lib/shield/event.service";
import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const TEN_MINUTES_MS = 10 * 60 * 1000;
let intervalHandle: NodeJS.Timeout | null = null;

async function runShieldMonitorCycle() {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const runs = await prisma.execution.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
      select: {
        id: true,
        workflowId: true,
        organizationId: true,
        snapshots: {
          orderBy: {
            capturedAt: "desc",
          },
          take: 1,
          select: {
            pageUrl: true,
            domHtml: true,
            id: true,
          },
        },
      },
      take: 200,
      orderBy: {
        createdAt: "desc",
      },
    });

    for (const run of runs) {
      if (!run.workflowId || run.snapshots.length === 0) {
        continue;
      }

      const snapshot = run.snapshots[0];
      const scan = scanDomContent(snapshot.domHtml.slice(0, 20_000));
      if (!scan.detected || scan.riskScore < 40) {
        continue;
      }

      const recent = await prisma.promptInjectionEvent.findFirst({
        where: {
          runId: run.id,
          domLocation: snapshot.id,
        },
        select: {
          id: true,
        },
      });
      if (recent) {
        continue;
      }

      await logPromptInjectionEvent({
        organizationId: run.organizationId,
        workflowId: run.workflowId,
        runId: run.id,
        url: snapshot.pageUrl ?? `https://workflow.operon.ai/runs/${run.id}`,
        domLocation: snapshot.id,
        injectedText: scan.matches[0]?.excerpt ?? "Unknown injection pattern",
        riskScore: scan.riskScore,
      });
    }

    logInfo("Operon Shield monitor cycle completed", {
      component: "shield-monitor-worker",
      metadata: {
        runCount: runs.length,
      },
    });
  } catch (error) {
    logError("Operon Shield monitor cycle failed", {
      component: "shield-monitor-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startShieldMonitorWorker() {
  if (intervalHandle) {
    return;
  }

  void runShieldMonitorCycle();
  intervalHandle = setInterval(() => {
    void runShieldMonitorCycle();
  }, TEN_MINUTES_MS);
}

export async function stopShieldMonitorWorker() {
  if (!intervalHandle) {
    return;
  }
  clearInterval(intervalHandle);
  intervalHandle = null;
}
