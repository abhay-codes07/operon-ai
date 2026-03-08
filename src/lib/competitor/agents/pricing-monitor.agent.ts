import { prisma } from "@/server/db/client";

import type { MonitoringTask } from "@/lib/competitor/agent-launcher.service";

type PricingPlan = {
  name: string;
  priceUsd: number;
};

function extractPlansFromHtml(html: string): PricingPlan[] {
  const matches = html.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/g) ?? [];
  return matches.slice(0, 5).map((value, index) => ({
    name: `Plan ${index + 1}`,
    priceUsd: Number(value.replace("$", "")),
  }));
}

export async function runPricingMonitorAgent(task: MonitoringTask) {
  const pricingUrl = `${task.website.replace(/\/$/, "")}/pricing`;
  const response = await fetch(pricingUrl, { method: "GET", cache: "no-store" }).catch(() => null);
  const html = response?.ok ? await response.text() : "";
  const plans = extractPlansFromHtml(html);

  const lastSignal = await prisma.competitorSignal.findFirst({
    where: {
      competitorId: task.competitorId,
      signalType: "PRICING_CHANGE",
    },
    orderBy: { createdAt: "desc" },
  });
  const previous = (lastSignal?.payload as { plans?: PricingPlan[] } | null)?.plans ?? [];
  const changed =
    previous.length !== plans.length ||
    previous.some((plan, index) => plan.priceUsd !== plans[index]?.priceUsd);

  if (!changed && previous.length > 0) {
    return;
  }

  await prisma.competitorSignal.create({
    data: {
      competitorId: task.competitorId,
      orgId: (await prisma.competitor.findUnique({ where: { id: task.competitorId }, select: { orgId: true } }))!
        .orgId,
      signalType: "PRICING_CHANGE",
      payload: {
        pricingUrl,
        plans,
      },
    },
  });
}
