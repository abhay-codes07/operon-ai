import { prisma } from "@/server/db/client";

export type ShieldSummary = {
  totalEvents: number;
  severity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  hotWorkflows: Array<{
    workflowId: string;
    workflowName: string;
    count: number;
  }>;
};

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

  const workflowNameRows = hotWorkflowIds.length
    ? await prisma.workflow.findMany({
        where: {
          id: {
            in: hotWorkflowIds.map((item) => item.workflowId),
          },
        },
        select: {
          id: true,
          name: true,
        },
      })
    : [];
  const workflowNameMap = new Map(workflowNameRows.map((item) => [item.id, item.name]));
  const hotWorkflows = hotWorkflowIds.map((item) => ({
    workflowId: String(item.workflowId),
    workflowName: String(workflowNameMap.get(item.workflowId) ?? "Unknown workflow"),
    count: Number(item.count),
  }));

  return {
    totalEvents,
    severity: {
      CRITICAL: criticalEvents,
      HIGH: highEvents,
      MEDIUM: mediumEvents,
      LOW: lowEvents,
    },
    hotWorkflows,
  } satisfies ShieldSummary;
}
