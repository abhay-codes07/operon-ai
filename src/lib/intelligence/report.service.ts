import { generateInsights } from "@/lib/intelligence/insight.service";
import { aggregateSignalsByType } from "@/lib/intelligence/signal.service";

export async function generateMorningReport(orgId: string) {
  const [insights, trend] = await Promise.all([
    generateInsights(orgId),
    aggregateSignalsByType(orgId),
  ]);

  const topInsights = insights.slice(0, 10);
  const lines = [
    "Operon AI Competitive Intelligence Morning Briefing",
    `Generated at ${new Date().toISOString()}`,
    `Total Signals: ${trend.reduce((sum, item) => sum + item.count, 0)}`,
    ...trend.map((item) => `${item.signalType}: ${item.count}`),
    ...topInsights.map((insight) => `${insight.competitorName}: ${insight.title}`),
  ];

  return {
    generatedAt: new Date(),
    topInsights,
    trend,
    text: lines.join("\n"),
  };
}
