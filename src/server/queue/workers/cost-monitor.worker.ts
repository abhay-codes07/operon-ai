import { detectOrganizationCostAnomalies } from "@/lib/finops/anomaly.service";
import { checkBudget, applyThrottlingStrategy } from "@/lib/finops/budget.service";
import { getMonthlyCost } from "@/lib/finops/cost-aggregation.service";
import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const TEN_MINUTES_MS = 10 * 60 * 1000;
let intervalHandle: NodeJS.Timeout | null = null;

async function runCostMonitorCycle() {
  try {
    const workflows = await prisma.workflow.findMany({
      select: {
        id: true,
        organizationId: true,
      },
    });

    let exceededBudgetCount = 0;
    for (const workflow of workflows) {
      const budget = await checkBudget(workflow.id);
      if (budget?.exceededBudget) {
        exceededBudgetCount += 1;
        await applyThrottlingStrategy(workflow.id);
      }
    }

    const organizations = await prisma.organization.findMany({
      select: { id: true },
    });
    let anomaliesCount = 0;
    for (const organization of organizations) {
      const anomalies = await detectOrganizationCostAnomalies(organization.id);
      anomaliesCount += anomalies.length;
      await getMonthlyCost(organization.id);
    }

    logInfo("FinOps cost monitor cycle completed", {
      component: "cost-monitor-worker",
      metadata: {
        workflowsChecked: workflows.length,
        exceededBudgetCount,
        anomaliesDetected: anomaliesCount,
      },
    });
  } catch (error) {
    logError("FinOps cost monitor cycle failed", {
      component: "cost-monitor-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startCostMonitorWorker() {
  if (intervalHandle) {
    return;
  }

  void runCostMonitorCycle();
  intervalHandle = setInterval(() => {
    void runCostMonitorCycle();
  }, TEN_MINUTES_MS);
}

export async function stopCostMonitorWorker() {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
}
