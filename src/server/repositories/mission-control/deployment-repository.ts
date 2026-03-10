import { prisma } from "@/server/db/client";

type FleetStatus = "RUNNING" | "IDLE" | "FAILED" | "RETRYING";

export async function upsertAgentDeployment(input: {
  organizationId: string;
  agentId: string;
  desiredRuns: number;
  status: FleetStatus;
  notes?: string;
}) {
  return prisma.agentDeployment.upsert({
    where: {
      organizationId_agentId: {
        organizationId: input.organizationId,
        agentId: input.agentId,
      },
    },
    update: {
      desiredRuns: input.desiredRuns,
      status: input.status,
      notes: input.notes,
    },
    create: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      desiredRuns: input.desiredRuns,
      status: input.status,
      notes: input.notes,
      actualRuns: 0,
    },
  });
}

export async function updateAgentDeploymentActualRuns(input: {
  organizationId: string;
  agentId: string;
  actualRuns: number;
  status?: FleetStatus;
}) {
  return prisma.agentDeployment.updateMany({
    where: {
      organizationId: input.organizationId,
      agentId: input.agentId,
    },
    data: {
      actualRuns: input.actualRuns,
      status: input.status,
    },
  });
}

export async function listAgentDeployments(organizationId: string) {
  return prisma.agentDeployment.findMany({
    where: {
      organizationId,
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}
