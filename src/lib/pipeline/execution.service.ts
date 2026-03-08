import { prisma } from "@/server/db/client";

export async function createPipelineRun(input: {
  pipelineId: string;
  orgId: string;
  inputPayload?: Record<string, unknown>;
}) {
  return prisma.pipelineRun.create({
    data: {
      pipelineId: input.pipelineId,
      orgId: input.orgId,
      status: "RUNNING",
      inputPayload: input.inputPayload ?? {},
      contextPayload: input.inputPayload ?? {},
    },
  });
}

export async function pausePipelineRun(pipelineRunId: string, orgId: string) {
  return prisma.pipelineRun.updateMany({
    where: {
      id: pipelineRunId,
      orgId,
      status: "RUNNING",
    },
    data: {
      status: "PAUSED",
    },
  });
}

export async function resumePipelineRun(pipelineRunId: string, orgId: string) {
  return prisma.pipelineRun.updateMany({
    where: {
      id: pipelineRunId,
      orgId,
      status: "PAUSED",
    },
    data: {
      status: "RUNNING",
      errorMessage: null,
    },
  });
}
