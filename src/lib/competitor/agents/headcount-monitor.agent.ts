import { prisma } from "@/server/db/client";

import type { MonitoringTask } from "@/lib/competitor/agent-launcher.service";

function estimateHeadcountFromPage(html: string): number {
  const numberMatches: number[] = [];
  const pattern = /\b([1-9][0-9]{1,5})\b/g;
  let match: RegExpExecArray | null = pattern.exec(html);
  while (match) {
    numberMatches.push(Number(match[1]));
    match = pattern.exec(html);
  }
  if (numberMatches.length === 0) {
    return 0;
  }
  return numberMatches.sort((a, b) => b - a)[0] ?? 0;
}

export async function runHeadcountMonitorAgent(task: MonitoringTask) {
  const linkedinAboutUrl = `https://www.linkedin.com/company/${task.competitorName
    .toLowerCase()
    .replace(/\s+/g, "-")}/about/`;
  const response = await fetch(linkedinAboutUrl, { method: "GET", cache: "no-store" }).catch(() => null);
  const html = response?.ok ? await response.text() : "";
  const estimatedHeadcount = estimateHeadcountFromPage(html);

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
      signalType: "HEADCOUNT_CHANGE",
    },
    orderBy: { createdAt: "desc" },
  });
  const previousHeadcount = (previousSignal?.payload as { estimatedHeadcount?: number } | null)?.estimatedHeadcount ?? 0;
  const velocity = estimatedHeadcount - previousHeadcount;

  await prisma.competitorSignal.create({
    data: {
      competitorId: task.competitorId,
      orgId: competitor.orgId,
      signalType: "HEADCOUNT_CHANGE",
      payload: {
        linkedinAboutUrl,
        estimatedHeadcount,
        previousHeadcount,
        hiringVelocity: velocity,
      },
    },
  });
}
