import { launchParallelAgents, type MonitoringTask } from "@/lib/competitor/agent-launcher.service";
import { runFeatureMonitorAgent } from "@/lib/competitor/agents/feature-monitor.agent";
import { runPricingMonitorAgent } from "@/lib/competitor/agents/pricing-monitor.agent";
import { runReviewMonitorAgent } from "@/lib/competitor/agents/review-monitor.agent";
import { generateInsights } from "@/lib/intelligence/insight.service";
import { prisma } from "@/server/db/client";

export async function runCompetitiveIntelligencePipeline(orgId: string) {
  const competitors = await prisma.competitor.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      website: true,
    },
  });

  const tasks: MonitoringTask[] = competitors.map((competitor) => ({
    competitorId: competitor.id,
    competitorName: competitor.name,
    website: competitor.website,
  }));

  if (tasks.length === 0) {
    return {
      tasksProcessed: 0,
      insights: [],
    };
  }

  await launchParallelAgents({
    tasks,
    agents: [runPricingMonitorAgent, runFeatureMonitorAgent, runReviewMonitorAgent],
    concurrency: 4,
  });

  const insights = await generateInsights(orgId);
  return {
    tasksProcessed: tasks.length,
    insights,
  };
}
