import { prisma } from "@/server/db/client";

export async function listRunCoPilotInterventions(input: {
  organizationId: string;
  runId: string;
}) {
  return prisma.coPilotIntervention.findMany({
    where: {
      organizationId: input.organizationId,
      session: {
        runId: input.runId,
      },
    },
    orderBy: { timestamp: "asc" },
    include: {
      session: {
        select: {
          id: true,
          workflowId: true,
          runId: true,
        },
      },
    },
  });
}
