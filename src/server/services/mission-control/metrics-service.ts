import { countExecutionsInWindow, summarizeExecutionOutcomesInWindow } from "@/server/repositories/mission-control/metrics-repository";
import { fetchIncidentCountForWindow } from "@/server/services/mission-control/incident-detection-service";

export async function fetchOperationalMetrics(input: {
  organizationId: string;
  hours?: number;
}) {
  const hours = input.hours ?? 24;
  const to = new Date();
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000);

  const [executionCount, outcomeSummary, incidentCount] = await Promise.all([
    countExecutionsInWindow({
      organizationId: input.organizationId,
      from,
      to,
    }),
    summarizeExecutionOutcomesInWindow({
      organizationId: input.organizationId,
      from,
      to,
    }),
    fetchIncidentCountForWindow({
      organizationId: input.organizationId,
      from,
      to,
    }),
  ]);

  const runsPerHour = Number((executionCount / hours).toFixed(2));
  const successRate =
    outcomeSummary.totalCount === 0 ? 0 : Number(((outcomeSummary.successCount / outcomeSummary.totalCount) * 100).toFixed(2));

  return {
    windowHours: hours,
    runsPerHour,
    successRate,
    incidentCount,
    averageExecutionSeconds: outcomeSummary.averageExecutionSeconds,
    executions: {
      total: outcomeSummary.totalCount,
      succeeded: outcomeSummary.successCount,
      failed: outcomeSummary.failedCount,
    },
  };
}
