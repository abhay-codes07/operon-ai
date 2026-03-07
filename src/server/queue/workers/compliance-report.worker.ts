import { generatePlainEnglishSummary } from "@/lib/compliance/passport.service";
import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let intervalHandle: NodeJS.Timeout | null = null;

async function runComplianceReportCycle() {
  try {
    const workflows = await prisma.workflow.findMany({
      select: { id: true },
    });

    let generatedCount = 0;
    for (const workflow of workflows) {
      const result = await generatePlainEnglishSummary(workflow.id);
      if (result) {
        generatedCount += 1;
      }
    }

    logInfo("Compliance passport report cycle completed", {
      component: "compliance-report-worker",
      metadata: {
        workflowCount: workflows.length,
        generatedCount,
      },
    });
  } catch (error) {
    logError("Compliance passport report cycle failed", {
      component: "compliance-report-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startComplianceReportWorker() {
  if (intervalHandle) {
    return;
  }

  void runComplianceReportCycle();
  intervalHandle = setInterval(() => {
    void runComplianceReportCycle();
  }, ONE_DAY_MS);
}

export async function stopComplianceReportWorker() {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
}
