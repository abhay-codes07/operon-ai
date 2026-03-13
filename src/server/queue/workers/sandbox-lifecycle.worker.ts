import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const SANDBOX_LIFECYCLE_MS = 5 * 60_000;
let intervalHandle: NodeJS.Timeout | null = null;

async function runSandboxLifecycleCycle() {
  try {
    const staleSessionCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const staleIdentityCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [expiredSessions, revokedIdentities] = await Promise.all([
      prisma.sandboxSession.deleteMany({
        where: {
          lastActivity: { lt: staleSessionCutoff },
        },
      }),
      prisma.sandboxIdentity.updateMany({
        where: {
          status: "ACTIVE",
          createdAt: { lt: staleIdentityCutoff },
        },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
        },
      }),
    ]);

    logInfo("Sandbox lifecycle cycle completed", {
      component: "sandbox-lifecycle-worker",
      metadata: {
        expiredSessions: expiredSessions.count,
        revokedIdentities: revokedIdentities.count,
      },
    });
  } catch (error) {
    logError("Sandbox lifecycle cycle failed", {
      component: "sandbox-lifecycle-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startSandboxLifecycleWorker() {
  if (intervalHandle) {
    return;
  }
  void runSandboxLifecycleCycle();
  intervalHandle = setInterval(() => {
    void runSandboxLifecycleCycle();
  }, SANDBOX_LIFECYCLE_MS);
}

export async function stopSandboxLifecycleWorker() {
  if (!intervalHandle) {
    return;
  }
  clearInterval(intervalHandle);
  intervalHandle = null;
}
