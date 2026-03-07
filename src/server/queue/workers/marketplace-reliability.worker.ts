import { recomputeAllTemplateReliabilityScores } from "@/lib/marketplace/reliability.service";
import { logError, logInfo } from "@/server/observability/logger";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

let intervalHandle: NodeJS.Timeout | null = null;

async function runReliabilityRecomputeCycle() {
  try {
    const results = await recomputeAllTemplateReliabilityScores();
    logInfo("OperonHub reliability recompute cycle completed", {
      component: "marketplace-reliability-worker",
      metadata: {
        templateCount: results.length,
      },
    });
  } catch (error) {
    logError("OperonHub reliability recompute cycle failed", {
      component: "marketplace-reliability-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startMarketplaceReliabilityWorker() {
  if (intervalHandle) {
    return;
  }

  void runReliabilityRecomputeCycle();
  intervalHandle = setInterval(() => {
    void runReliabilityRecomputeCycle();
  }, SIX_HOURS_MS);
}

export async function stopMarketplaceReliabilityWorker() {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
}
