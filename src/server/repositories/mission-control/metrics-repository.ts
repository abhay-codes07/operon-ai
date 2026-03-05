import { prisma } from "@/server/db/client";

export async function countExecutionsInWindow(input: {
  organizationId: string;
  from: Date;
  to: Date;
}) {
  return prisma.execution.count({
    where: {
      organizationId: input.organizationId,
      createdAt: {
        gte: input.from,
        lte: input.to,
      },
    },
  });
}

export async function summarizeExecutionOutcomesInWindow(input: {
  organizationId: string;
  from: Date;
  to: Date;
}) {
  const items = await prisma.execution.findMany({
    where: {
      organizationId: input.organizationId,
      createdAt: {
        gte: input.from,
        lte: input.to,
      },
    },
    select: {
      status: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
    },
  });

  const successCount = items.filter((item) => item.status === "SUCCEEDED").length;
  const failedCount = items.filter((item) => item.status === "FAILED").length;
  const durations = items
    .filter((item) => item.startedAt && item.finishedAt)
    .map((item) => (item.finishedAt!.getTime() - item.startedAt!.getTime()) / 1000);
  const averageExecutionSeconds =
    durations.length === 0
      ? 0
      : Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2));

  return {
    totalCount: items.length,
    successCount,
    failedCount,
    averageExecutionSeconds,
  };
}
