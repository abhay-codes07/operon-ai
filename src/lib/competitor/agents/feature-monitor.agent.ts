import { createHash } from "node:crypto";

import { prisma } from "@/server/db/client";

import type { MonitoringTask } from "@/lib/competitor/agent-launcher.service";

function hashDom(html: string): string {
  return createHash("sha256").update(html).digest("hex");
}

export async function runFeatureMonitorAgent(task: MonitoringTask) {
  const featuresUrl = `${task.website.replace(/\/$/, "")}/features`;
  const response = await fetch(featuresUrl, { method: "GET", cache: "no-store" }).catch(() => null);
  const html = response?.ok ? await response.text() : "";
  const domHash = hashDom(html);

  const previousSignal = await prisma.competitorSignal.findFirst({
    where: {
      competitorId: task.competitorId,
      signalType: "FEATURE_CHANGE",
    },
    orderBy: { createdAt: "desc" },
  });
  const previousHash = (previousSignal?.payload as { domHash?: string } | null)?.domHash ?? null;
  if (previousHash === domHash) {
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
      signalType: "FEATURE_CHANGE",
      payload: {
        featuresUrl,
        domHash,
        previousHash,
      },
    },
  });
}
