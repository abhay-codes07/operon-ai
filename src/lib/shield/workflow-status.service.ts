import { prisma } from "@/server/db/client";

export async function getWorkflowShieldStatus(input: {
  workflowId: string;
}) {
  const [baseline, latestEvent] = await Promise.all([
    prisma.agentBehaviorBaseline.findUnique({
      where: {
        workflowId: input.workflowId,
      },
      select: {
        id: true,
      },
    }),
    prisma.promptInjectionEvent.findFirst({
      where: {
        workflowId: input.workflowId,
      },
      orderBy: {
        detectedAt: "desc",
      },
      select: {
        id: true,
        severity: true,
        detectedAt: true,
      },
    }),
  ]);

  return {
    baselineConfigured: Boolean(baseline),
    lastThreat: latestEvent
      ? {
          id: latestEvent.id,
          severity: latestEvent.severity,
          detectedAt: latestEvent.detectedAt,
        }
      : null,
  };
}
