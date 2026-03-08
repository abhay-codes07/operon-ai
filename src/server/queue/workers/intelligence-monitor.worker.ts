import { prisma } from "@/server/db/client";
import { logError, logInfo } from "@/server/observability/logger";
import { launchParallelAgents } from "@/lib/competitor/agent-launcher.service";
import { runFeatureMonitorAgent } from "@/lib/competitor/agents/feature-monitor.agent";
import { runHeadcountMonitorAgent } from "@/lib/competitor/agents/headcount-monitor.agent";
import { runJobMonitorAgent } from "@/lib/competitor/agents/job-monitor.agent";
import { runPricingMonitorAgent } from "@/lib/competitor/agents/pricing-monitor.agent";
import { runReviewMonitorAgent } from "@/lib/competitor/agents/review-monitor.agent";
import { generateInsights } from "@/lib/intelligence/insight.service";
import { sendSlackAlert } from "@/lib/intelligence/notification.service";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
let intervalHandle: NodeJS.Timeout | null = null;

async function runIntelligenceCycle() {
  try {
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    for (const organization of organizations) {
      const competitors = await prisma.competitor.findMany({
        where: { orgId: organization.id },
        select: { id: true, name: true, website: true },
      });
      if (competitors.length === 0) {
        continue;
      }

      const tasks = competitors.map((competitor) => ({
        competitorId: competitor.id,
        competitorName: competitor.name,
        website: competitor.website,
      }));
      await launchParallelAgents({
        tasks,
        agents: [
          runPricingMonitorAgent,
          runFeatureMonitorAgent,
          runReviewMonitorAgent,
          runJobMonitorAgent,
          runHeadcountMonitorAgent,
        ],
        concurrency: 4,
      });

      const insights = await generateInsights(organization.id);
      const top = insights[0];
      if (top) {
        await sendSlackAlert({
          title: `Intelligence Alert: ${top.competitorName}`,
          message: `${top.title} — ${top.details}`,
          metadata: { organizationId: organization.id },
        });
      }
    }

    logInfo("Intelligence monitor cycle completed", {
      component: "intelligence-monitor-worker",
    });
  } catch (error) {
    logError("Intelligence monitor cycle failed", {
      component: "intelligence-monitor-worker",
      metadata: {
        reason: error instanceof Error ? error.message : "unknown_error",
      },
    });
  }
}

export function startIntelligenceMonitorWorker() {
  if (intervalHandle) {
    return;
  }
  void runIntelligenceCycle();
  intervalHandle = setInterval(() => {
    void runIntelligenceCycle();
  }, THIRTY_MINUTES_MS);
}

export async function stopIntelligenceMonitorWorker() {
  if (!intervalHandle) {
    return;
  }
  clearInterval(intervalHandle);
  intervalHandle = null;
}
