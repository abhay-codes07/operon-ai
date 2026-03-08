import { prisma } from "@/server/db/client";

import type { MonitoringTask } from "@/lib/competitor/agent-launcher.service";

const reviewSources = ["g2.com", "capterra.com", "trustpilot.com"] as const;

function computeSentiment(text: string): "POSITIVE" | "NEUTRAL" | "NEGATIVE" {
  const positiveWords = ["good", "great", "excellent", "love", "best", "improved"];
  const negativeWords = ["bad", "poor", "terrible", "hate", "worst", "issue"];
  const lowered = text.toLowerCase();
  const positive = positiveWords.filter((word) => lowered.includes(word)).length;
  const negative = negativeWords.filter((word) => lowered.includes(word)).length;
  if (positive > negative) return "POSITIVE";
  if (negative > positive) return "NEGATIVE";
  return "NEUTRAL";
}

export async function runReviewMonitorAgent(task: MonitoringTask) {
  const snippets = [] as Array<{ source: string; text: string; sentiment: string }>;

  for (const source of reviewSources) {
    const url = `https://${source}/products/${task.competitorName.toLowerCase().replace(/\s+/g, "-")}/reviews`;
    const response = await fetch(url, { method: "GET", cache: "no-store" }).catch(() => null);
    if (!response?.ok) {
      continue;
    }
    const html = await response.text();
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 400);
    snippets.push({
      source,
      text,
      sentiment: computeSentiment(text),
    });
  }

  if (snippets.length === 0) {
    return;
  }

  const competitor = await prisma.competitor.findUnique({
    where: { id: task.competitorId },
    select: { orgId: true },
  });
  if (!competitor) {
    return;
  }

  await prisma.competitorSignal.create({
    data: {
      competitorId: task.competitorId,
      orgId: competitor.orgId,
      signalType: "REVIEW_SENTIMENT",
      payload: {
        reviews: snippets,
      },
    },
  });
}
