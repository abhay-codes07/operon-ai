import { prisma } from "@/server/db/client";

export async function getShieldSummary(organizationId: string) {
  const [totalEvents, criticalEvents, highEvents, mediumEvents, lowEvents, latestEvents] = await Promise.all([
    prisma.promptInjectionEvent.count({
      where: {
        orgId: organizationId,
      },
    }),
    prisma.promptInjectionEvent.count({
      where: {
        orgId: organizationId,
        severity: "CRITICAL",
      },
    }),
    prisma.promptInjectionEvent.count({
      where: {
        orgId: organizationId,
        severity: "HIGH",
      },
    }),
    prisma.promptInjectionEvent.count({
      where: {
        orgId: organizationId,
        severity: "MEDIUM",
      },
    }),
    prisma.promptInjectionEvent.count({
      where: {
        orgId: organizationId,
        severity: "LOW",
      },
    }),
    prisma.promptInjectionEvent.findMany({
      where: {
        orgId: organizationId,
      },
      orderBy: {
        detectedAt: "desc",
      },
      take: 300,
      select: {
        workflowId: true,
      },
    }),
  ]);

  const workflowCounts = new Map<string, number>();
  for (const event of latestEvents) {
    workflowCounts.set(event.workflowId, (workflowCounts.get(event.workflowId) ?? 0) + 1);
  }

  const hotWorkflowIds = [...workflowCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([workflowId, count]) => ({ workflowId, count }));

  return {
    totalEvents,
    severity: {
      CRITICAL: criticalEvents,
      HIGH: highEvents,
      MEDIUM: mediumEvents,
      LOW: lowEvents,
    },
    hotWorkflowIds,
  };
}
