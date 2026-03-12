import type { CoPilotInterventionInput } from "@/lib/copilot/types";
import { prisma } from "@/server/db/client";

export async function startCoPilotSession(input: {
  organizationId: string;
  workflowId: string;
  runId: string;
}) {
  return prisma.coPilotSession.create({
    data: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      runId: input.runId,
    },
  });
}

export async function logIntervention(input: CoPilotInterventionInput & { organizationId: string }) {
  return prisma.coPilotIntervention.create({
    data: {
      organizationId: input.organizationId,
      sessionId: input.sessionId,
      stepId: input.stepId,
      interventionType: input.interventionType ?? "CONFIRM",
      agentConfidence: input.agentConfidence,
      agentSuggestedAction: input.agentSuggestedAction,
      humanAction: input.humanAction,
      metadata: input.metadata,
    },
  });
}

export async function endSession(sessionId: string) {
  return prisma.coPilotSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
    },
  });
}

export async function getCoPilotSessionByRun(runId: string) {
  return prisma.coPilotSession.findFirst({
    where: {
      runId,
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function getSessionWithInterventions(sessionId: string, organizationId: string) {
  return prisma.coPilotSession.findFirst({
    where: {
      id: sessionId,
      organizationId,
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
      run: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
        },
      },
      interventions: {
        orderBy: { timestamp: "asc" },
      },
    },
  });
}

export async function listTrainingData(organizationId: string, limit = 500) {
  return prisma.coPilotIntervention.findMany({
    where: { organizationId },
    orderBy: { timestamp: "desc" },
    take: limit,
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
