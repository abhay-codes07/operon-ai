import { prisma } from "@/server/db/client";
import { logPipelineAuditEvent } from "@/lib/pipeline/audit.service";
import { createPipelineRun, pausePipelineRun, resumePipelineRun } from "@/lib/pipeline/execution.service";
import type { CreatePipelineInput, PipelineStepInput } from "@/lib/pipeline/pipeline.schemas";

export async function createPipeline(orgId: string, config: CreatePipelineInput) {
  const pipeline = await prisma.pipeline.create({
    data: {
      orgId,
      name: config.name,
      description: config.description,
      steps: {
        create: config.steps.map((step) => ({
          agentId: step.agentId,
          stepOrder: step.stepOrder,
          inputMapping: step.inputMapping,
          outputMapping: step.outputMapping,
        })),
      },
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  await logPipelineAuditEvent({
    orgId,
    pipelineId: pipeline.id,
    eventType: "PIPELINE_CREATED",
    message: `Pipeline ${pipeline.name} created`,
    agentId: pipeline.steps[0]?.agentId,
  });

  return pipeline;
}

export async function addPipelineStep(pipelineId: string, step: PipelineStepInput) {
  return prisma.pipelineStep.create({
    data: {
      pipelineId,
      agentId: step.agentId,
      stepOrder: step.stepOrder,
      inputMapping: step.inputMapping,
      outputMapping: step.outputMapping,
    },
  });
}

export async function listPipelines(orgId: string) {
  return prisma.pipeline.findMany({
    where: { orgId },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPipelineById(orgId: string, pipelineId: string) {
  return prisma.pipeline.findFirst({
    where: {
      id: pipelineId,
      orgId,
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
      runs: {
        orderBy: { startedAt: "desc" },
        include: {
          stepRuns: {
            include: {
              step: true,
              agentRun: {
                select: {
                  id: true,
                  status: true,
                  startedAt: true,
                  finishedAt: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

export async function startPipeline(
  pipelineId: string,
  input: Record<string, unknown>,
  orgId: string,
) {
  const pipeline = await prisma.pipeline.findFirst({
    where: {
      id: pipelineId,
      orgId,
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });
  if (!pipeline) {
    return null;
  }

  const run = await createPipelineRun({
    pipelineId: pipeline.id,
    orgId,
    inputPayload: input,
  });

  await logPipelineAuditEvent({
    orgId,
    pipelineId: pipeline.id,
    eventType: "PIPELINE_STARTED",
    message: `Pipeline ${pipeline.name} started`,
    agentId: pipeline.steps[0]?.agentId,
    metadata: { pipelineRunId: run.id },
  });

  return run;
}

export async function pausePipeline(pipelineRunId: string, orgId: string) {
  return pausePipelineRun(pipelineRunId, orgId);
}

export async function resumePipeline(pipelineRunId: string, orgId: string) {
  const run = await prisma.pipelineRun.findFirst({
    where: {
      id: pipelineRunId,
      orgId,
    },
    include: {
      pipeline: {
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      },
    },
  });
  if (!run) {
    return null;
  }

  const resumed = await resumePipelineRun(pipelineRunId, orgId);
  await logPipelineAuditEvent({
    orgId,
    pipelineId: run.pipelineId,
    eventType: "PIPELINE_RESUMED",
    message: `Pipeline ${run.pipeline.name} resumed`,
    agentId: run.pipeline.steps[0]?.agentId,
    metadata: { pipelineRunId: pipelineRunId, resumedCount: resumed.count },
  });

  return resumed;
}
