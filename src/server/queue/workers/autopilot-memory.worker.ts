import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const AUTOPILOT_MEMORY_TICK_MS = 60_000;

let intervalHandle: NodeJS.Timeout | null = null;

function extractStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

async function runAutopilotMemoryCycle() {
  try {
    const staleCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const staleUpdate = await prisma.autopilotSession.updateMany({
      where: {
        status: "RECORDING",
        startedAt: {
          lt: staleCutoff,
        },
      },
      data: {
        status: "FAILED",
        completedAt: new Date(),
      },
    });

    const sessions = await prisma.autopilotSession.findMany({
      where: {
        status: {
          in: ["REVIEW", "COMPLETED"],
        },
        completedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        orgId: true,
        domain: true,
        status: true,
        compiledDefinition: true,
      },
      orderBy: { completedAt: "desc" },
      take: 200,
    });

    for (const session of sessions) {
      const compiled =
        session.compiledDefinition && typeof session.compiledDefinition === "object"
          ? (session.compiledDefinition as Record<string, unknown>)
          : null;
      const rawSteps = compiled?.steps;
      const steps = Array.isArray(rawSteps) ? rawSteps : [];

      const selectorPatterns = steps
        .map((step) => (step && typeof step === "object" ? (step as Record<string, unknown>).selector : undefined))
        .filter((value): value is string => typeof value === "string");

      const navigationPatterns = steps
        .map((step) => (step && typeof step === "object" ? (step as Record<string, unknown>).url : undefined))
        .filter((value): value is string => typeof value === "string");

      const existing = await prisma.domainMemory.findUnique({
        where: {
          orgId_domain: {
            orgId: session.orgId,
            domain: session.domain,
          },
        },
      });

      const mergedSelectors = [...new Set([...(extractStringArray(existing?.selectorPatterns) ?? []), ...selectorPatterns])];
      const mergedNavigation = [
        ...new Set([...(extractStringArray(existing?.navigationPatterns) ?? []), ...navigationPatterns]),
      ];

      const currentScore = existing?.reliabilityScore ?? 0.5;
      const nextScore = session.status === "COMPLETED" ? Math.min(1, currentScore + 0.02) : Math.min(1, currentScore);

      await prisma.domainMemory.upsert({
        where: {
          orgId_domain: {
            orgId: session.orgId,
            domain: session.domain,
          },
        },
        create: {
          orgId: session.orgId,
          domain: session.domain,
          selectorPatterns: mergedSelectors.slice(-500),
          navigationPatterns: mergedNavigation.slice(-500),
          reliabilityScore: Number(nextScore.toFixed(3)),
        },
        update: {
          selectorPatterns: mergedSelectors.slice(-500),
          navigationPatterns: mergedNavigation.slice(-500),
          reliabilityScore: Number(nextScore.toFixed(3)),
          updatedAt: new Date(),
        },
      });
    }

    if (sessions.length > 0) {
      logInfo("Autopilot memory worker cycle completed", {
        component: "autopilot-memory-worker",
        metadata: {
          sessions: sessions.length,
          staleSessionsFailed: staleUpdate.count,
        },
      });
    }
  } catch (error) {
    logError("Autopilot memory worker cycle failed", {
      component: "autopilot-memory-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startAutopilotMemoryWorker() {
  if (intervalHandle) {
    return;
  }

  void runAutopilotMemoryCycle();
  intervalHandle = setInterval(() => {
    void runAutopilotMemoryCycle();
  }, AUTOPILOT_MEMORY_TICK_MS);
}

export async function stopAutopilotMemoryWorker() {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
}
