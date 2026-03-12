import { prisma } from "@/server/db/client";

export async function getCoPilotSummary(organizationId: string) {
  const [sessions, interventions] = await Promise.all([
    prisma.coPilotSession.aggregate({
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.coPilotIntervention.aggregate({
      where: { organizationId },
      _count: { _all: true },
      _avg: { agentConfidence: true },
    }),
  ]);

  return {
    sessionCount: sessions._count._all,
    interventionCount: interventions._count._all,
    averageAgentConfidence: Number(interventions._avg.agentConfidence ?? 0),
  };
}
