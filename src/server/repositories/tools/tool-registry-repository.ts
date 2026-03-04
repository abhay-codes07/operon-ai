import type { ToolExecutionItem, ToolListItem, ToolVersionItem } from "@/modules/tools/contracts";
import {
  executeToolSchema,
  installToolSchema,
  registerToolSchema,
  versionToolSchema,
} from "@/modules/tools/schemas";
import { prisma } from "@/server/db/client";

export async function createTool(input: unknown): Promise<ToolListItem> {
  const parsed = registerToolSchema.parse(input);

  const created = await prisma.tool.create({
    data: {
      organizationId: parsed.organizationId,
      createdByAgentId: parsed.createdByAgentId,
      name: parsed.name,
      description: parsed.description,
    },
  });

  const version = await prisma.toolVersion.create({
    data: {
      organizationId: parsed.organizationId,
      toolId: created.id,
      versionNumber: 1,
      workflowSteps: parsed.workflowSteps,
      notes: parsed.notes,
    },
  });

  return prisma.tool.update({
    where: {
      id: created.id,
    },
    data: {
      currentVersionId: version.id,
    },
  });
}

export async function listTools(organizationId: string, query?: string): Promise<ToolListItem[]> {
  const trimmed = query?.trim();
  return prisma.tool.findMany({
    where: {
      organizationId,
      OR: trimmed
        ? [
            { name: { contains: trimmed, mode: "insensitive" } },
            { description: { contains: trimmed, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: [{ reliabilityScore: "desc" }, { usageCount: "desc" }],
  });
}

export async function getToolById(organizationId: string, toolId: string): Promise<ToolListItem | null> {
  return prisma.tool.findFirst({
    where: {
      organizationId,
      id: toolId,
    },
  });
}

export async function createToolVersion(input: unknown): Promise<ToolVersionItem> {
  const parsed = versionToolSchema.parse(input);

  const latest = await prisma.toolVersion.findFirst({
    where: {
      toolId: parsed.toolId,
      organizationId: parsed.organizationId,
    },
    orderBy: {
      versionNumber: "desc",
    },
    select: {
      versionNumber: true,
    },
  });

  const version = await prisma.toolVersion.create({
    data: {
      organizationId: parsed.organizationId,
      toolId: parsed.toolId,
      workflowSteps: parsed.workflowSteps,
      notes: parsed.notes,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
    },
  });

  await prisma.tool.update({
    where: { id: parsed.toolId },
    data: { currentVersionId: version.id },
  });

  return version;
}

export async function listToolVersions(organizationId: string, toolId: string): Promise<ToolVersionItem[]> {
  return prisma.toolVersion.findMany({
    where: {
      organizationId,
      toolId,
    },
    orderBy: {
      versionNumber: "desc",
    },
  });
}

export async function updateToolVersionValidation(input: {
  toolVersionId: string;
  validationScore: number;
  validated: boolean;
  notes?: string;
}) {
  return prisma.toolVersion.update({
    where: {
      id: input.toolVersionId,
    },
    data: {
      validationScore: input.validationScore,
      validated: input.validated,
      notes: input.notes,
    },
  });
}

export async function createToolExecution(input: unknown): Promise<ToolExecutionItem> {
  const parsed = executeToolSchema.parse(input);

  return prisma.toolExecution.create({
    data: {
      organizationId: parsed.organizationId,
      toolId: parsed.toolId,
      toolVersionId: parsed.toolVersionId,
      executionId: parsed.executionId,
      status: parsed.status,
      durationMs: parsed.durationMs,
      output: parsed.output,
      errorMessage: parsed.errorMessage,
    },
  });
}

export async function incrementToolUsageAndReliability(input: {
  toolId: string;
  success: boolean;
}) {
  const tool = await prisma.tool.findUnique({
    where: { id: input.toolId },
    select: { id: true, usageCount: true, reliabilityScore: true },
  });

  if (!tool) {
    throw new Error("Tool not found for usage update");
  }

  const nextUsageCount = tool.usageCount + 1;
  const successWeight = input.success ? 1 : 0;
  const normalized = (tool.reliabilityScore / 100) * tool.usageCount;
  const nextScore = ((normalized + successWeight) / nextUsageCount) * 100;

  return prisma.tool.update({
    where: { id: tool.id },
    data: {
      usageCount: nextUsageCount,
      reliabilityScore: Number(nextScore.toFixed(2)),
    },
  });
}

export async function installToolToWorkflow(input: unknown) {
  const parsed = installToolSchema.parse(input);

  return prisma.toolInstallation.upsert({
    where: {
      workflowId_toolId: {
        workflowId: parsed.workflowId,
        toolId: parsed.toolId,
      },
    },
    update: {
      toolVersionId: parsed.toolVersionId,
      installedById: parsed.installedById,
      config: parsed.config,
    },
    create: {
      organizationId: parsed.organizationId,
      workflowId: parsed.workflowId,
      toolId: parsed.toolId,
      toolVersionId: parsed.toolVersionId,
      installedById: parsed.installedById,
      config: parsed.config,
    },
  });
}

export async function listWorkflowInstalledTools(input: { organizationId: string; workflowId: string }) {
  return prisma.toolInstallation.findMany({
    where: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
    },
    include: {
      tool: true,
      toolVersion: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getToolRegistryMetrics(organizationId: string) {
  const [toolCount, validatedVersionCount, toolExecutionCount, avgReliability] = await Promise.all([
    prisma.tool.count({
      where: { organizationId },
    }),
    prisma.toolVersion.count({
      where: {
        organizationId,
        validated: true,
      },
    }),
    prisma.toolExecution.count({
      where: { organizationId },
    }),
    prisma.tool.aggregate({
      where: { organizationId },
      _avg: {
        reliabilityScore: true,
      },
    }),
  ]);

  return {
    toolCount,
    validatedVersionCount,
    toolExecutionCount,
    averageReliability: avgReliability._avg.reliabilityScore ?? 0,
  };
}
