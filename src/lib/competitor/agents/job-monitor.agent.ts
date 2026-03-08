import { prisma } from "@/server/db/client";

import type { MonitoringTask } from "@/lib/competitor/agent-launcher.service";

function estimateOpenJobsFromHtml(html: string): number {
  const keywordMatches = html.match(/job|position|opening/gi) ?? [];
  return Math.min(500, keywordMatches.length);
}

export async function runJobMonitorAgent(task: MonitoringTask) {
  const jobsUrl = `${task.website.replace(/\/$/, "")}/careers`;
  const response = await fetch(jobsUrl, { method: "GET", cache: "no-store" }).catch(() => null);
  const html = response?.ok ? await response.text() : "";
  const openings = estimateOpenJobsFromHtml(html);

  const competitor = await prisma.competitor.findUnique({
    where: { id: task.competitorId },
    select: { orgId: true },
  });
  if (!competitor) {
    return;
  }

  const previousSignal = await prisma.competitorSignal.findFirst({
    where: {
      competitorId: task.competitorId,
      signalType: "JOB_POSTING",
    },
    orderBy: { createdAt: "desc" },
  });
  const previousOpenings = (previousSignal?.payload as { openings?: number } | null)?.openings ?? 0;
  const delta = openings - previousOpenings;

  await prisma.competitorSignal.create({
    data: {
      competitorId: task.competitorId,
      orgId: competitor.orgId,
      signalType: "JOB_POSTING",
      payload: {
        jobsUrl,
        openings,
        previousOpenings,
        delta,
      },
    },
  });
}
