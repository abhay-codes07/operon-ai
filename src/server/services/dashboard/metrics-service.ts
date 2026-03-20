import { prisma } from "@/server/db/client";

export async function fetchDashboardMetrics(organizationId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get total agents in organization (based on workflow owners/creators)
  const totalAgents = await prisma.workflow.findMany({
    where: { organizationId },
    distinct: ['agentId'],
    select: { agentId: true },
  }).then(workflows => new Set(workflows.map(w => w.agentId)).size);

  // Get today's executions
  const todayExecutions = await prisma.execution.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: today,
      },
    },
    select: { id: true, status: true, createdAt: true, finishedAt: true },
  });

  // Get yesterday's executions for comparison
  const yesterdayExecutions = await prisma.execution.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: yesterday,
        lt: today,
      },
    },
    select: { id: true },
  });

  // Get last 7 days executions for success rate
  const sevenDayExecutions = await prisma.execution.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    select: { id: true, status: true, finishedAt: true, createdAt: true },
  });

  // Calculate metrics
  const dailyExecutions = todayExecutions.length;
  const yesterdayCount = yesterdayExecutions.length;
  const executionChange = dailyExecutions > 0 && yesterdayCount > 0 
    ? Math.round(((dailyExecutions - yesterdayCount) / yesterdayCount) * 100)
    : 0;

  const successCount = sevenDayExecutions.filter(e => e.status === "SUCCEEDED").length;
  const failedCount = sevenDayExecutions.filter(e => e.status === "FAILED").length;
  const totalCompleted = successCount + failedCount;
  const successRate = totalCompleted > 0 ? Math.round((successCount / totalCompleted) * 100 * 10) / 10 : 0;

  // Calculate average runtime (only for completed executions)
  const completedExecutions = sevenDayExecutions.filter(
    e => (e.status === "SUCCEEDED" || e.status === "FAILED") && e.finishedAt
  );
  
  let avgRuntimeSeconds = 0;
  if (completedExecutions.length > 0) {
    const totalDuration = completedExecutions.reduce((sum, execution) => {
      const duration = (execution.finishedAt!.getTime() - execution.createdAt.getTime()) / 1000;
      return sum + duration;
    }, 0);
    avgRuntimeSeconds = totalDuration / completedExecutions.length;
  }

  // Format average runtime as readable string
  const formatRuntime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  // Calculate active agents (agents with executions in last 7 days)
  const activeAgentsSet = new Set(
    sevenDayExecutions.map(e => {
      // Get agent ID from execution - would need to join with workflow
      return e;
    })
  );

  // Get agents with recent activity
  const activeAgents = await prisma.workflow
    .findMany({
      where: { organizationId },
      select: { agentId: true },
    })
    .then(async (workflows) => {
      const agentIds = new Set(workflows.map(w => w.agentId));
      
      // Get agents with recent executions
      const executingAgents = await prisma.execution
        .findMany({
          where: {
            organizationId,
            createdAt: { gte: sevenDaysAgo },
          },
          select: { workflow: { select: { agentId: true } } },
        })
        .then(executions => 
          new Set(executions.map(e => e.workflow?.agentId).filter(Boolean))
        );
      
      return executingAgents.size;
    });

  return {
    activeAgents,
    activeAgentsChange: totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0,
    dailyExecutions,
    executionChange,
    successRate,
    avgRuntime: formatRuntime(avgRuntimeSeconds),
    avgRuntimeSeconds,
  };
}

