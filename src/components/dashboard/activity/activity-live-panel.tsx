"use client";

import { useCallback, useMemo, useState } from "react";

import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { usePolling } from "@/lib/hooks/use-polling";

import { ExecutionLogTimeline } from "./execution-log-timeline";
import { ExecutionTimelineList } from "./execution-timeline-list";

type ExecutionItem = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  trigger: "MANUAL" | "SCHEDULED" | "API" | "RETRY";
  agentId: string;
  createdAt: string;
};

type ExecutionLogItem = {
  id: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
};

type ActivityLivePanelProps = {
  initialExecutions: ExecutionItem[];
  initialLogs: ExecutionLogItem[];
  statusFilter?: string;
};

export function ActivityLivePanel({
  initialExecutions,
  initialLogs,
  statusFilter,
}: ActivityLivePanelProps): JSX.Element {
  const [executions, setExecutions] = useState(initialExecutions);
  const [logs, setLogs] = useState(initialLogs);

  const refresh = useCallback(async () => {
    const executionsParams = new URLSearchParams({
      page: "1",
      pageSize: "12",
    });

    if (statusFilter) {
      executionsParams.set("status", statusFilter);
    }

    const executionResponse = await fetch(`/api/internal/executions?${executionsParams.toString()}`, {
      cache: "no-store",
    });

    if (!executionResponse.ok) {
      return;
    }

    const executionPayload = (await executionResponse.json()) as { items: ExecutionItem[] };
    setExecutions(executionPayload.items);

    const selectedExecutionId = executionPayload.items[0]?.id;
    if (!selectedExecutionId) {
      setLogs([]);
      return;
    }

    const logsResponse = await fetch(
      `/api/internal/executions/${selectedExecutionId}/logs?page=1&pageSize=50`,
      {
        cache: "no-store",
      },
    );

    if (!logsResponse.ok) {
      return;
    }

    const logsPayload = (await logsResponse.json()) as { items: ExecutionLogItem[] };
    setLogs(logsPayload.items);
  }, [statusFilter]);

  usePolling(refresh, 5000, true);

  const mappedExecutions = useMemo(
    () =>
      executions.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      })),
    [executions],
  );

  const mappedLogs = useMemo(
    () =>
      logs.map((item) => ({
        ...item,
        occurredAt: new Date(item.occurredAt),
      })),
    [logs],
  );

  const latestExecution = executions[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr,1fr]">
      <DashboardCard title="Recent Executions" description="Most recent runs across all workflow triggers.">
        <ExecutionTimelineList items={mappedExecutions} />
      </DashboardCard>

      <DashboardCard
        title="Execution Log Stream"
        description={latestExecution ? `Latest execution: ${latestExecution.id.slice(-8)}` : "No executions yet"}
      >
        <ExecutionLogTimeline logs={mappedLogs} />
      </DashboardCard>
    </div>
  );
}
