"use client";

import { useCallback, useMemo, useState } from "react";

import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ExecutionStatusBadge } from "@/components/dashboard/status/execution-status-badge";
import { usePolling } from "@/lib/hooks/use-polling";

import { ExecutionReplayViewer } from "./execution-replay-viewer";
import { ExecutionLogTimeline } from "./execution-log-timeline";
import { RetryExecutionButton } from "./retry-execution-button";
import { SelfHealingPanel } from "./self-healing-panel";
import { AgentMemoryPanel } from "./agent-memory-panel";

type ExecutionDetail = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  trigger: "MANUAL" | "SCHEDULED" | "API" | "RETRY";
  agentId: string;
  workflowId?: string | null;
  errorMessage?: string | null;
  outputPayload?: Record<string, unknown> | null;
};

type ExecutionLog = {
  id: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
};

type ExecutionDetailLivePanelProps = {
  initialExecution: ExecutionDetail;
  initialLogs: ExecutionLog[];
  initialReplay: {
    steps: Array<{
      id: string;
      stepIndex: number;
      stepKey: string;
      action: string;
      target?: string | null;
      status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
      metadata?: Record<string, unknown> | null;
    }>;
    snapshots: Array<{
      id: string;
      executionStepId?: string | null;
      pageUrl?: string | null;
      domHtml: string;
      capturedAt: string;
    }>;
  };
  initialSelfHealingRecords: Array<{
    id: string;
    originalSelector?: string | null;
    resolvedSelector: string;
    strategy: string;
    similarityScore: number;
    success: boolean;
    createdAt: string;
  }>;
  initialMemoryEntries: Array<{
    id: string;
    kind: "RUN_METADATA" | "PATTERN" | "FAILURE_RESOLUTION";
    memoryKey: string;
    memoryValue: Record<string, unknown>;
    confidence?: number | null;
    updatedAt: string;
  }>;
};

export function ExecutionDetailLivePanel({
  initialExecution,
  initialLogs,
  initialReplay,
  initialSelfHealingRecords,
  initialMemoryEntries,
}: ExecutionDetailLivePanelProps): JSX.Element {
  const [execution, setExecution] = useState(initialExecution);
  const [logs, setLogs] = useState(initialLogs);
  const [replay, setReplay] = useState(initialReplay);
  const [selfHealingRecords, setSelfHealingRecords] = useState(initialSelfHealingRecords);
  const [memoryEntries, setMemoryEntries] = useState(initialMemoryEntries);

  const refresh = useCallback(async () => {
    const executionResponse = await fetch(`/api/internal/executions/${initialExecution.id}`, {
      cache: "no-store",
    });

    if (executionResponse.ok) {
      const executionPayload = (await executionResponse.json()) as ExecutionDetail;
      setExecution(executionPayload);
    }

    const logsResponse = await fetch(`/api/internal/executions/${initialExecution.id}/logs?page=1&pageSize=200`, {
      cache: "no-store",
    });

    if (logsResponse.ok) {
      const logsPayload = (await logsResponse.json()) as { items: ExecutionLog[] };
      setLogs(logsPayload.items);
    }

    const replayResponse = await fetch(`/api/internal/executions/${initialExecution.id}/replay`, {
      cache: "no-store",
    });

    if (replayResponse.ok) {
      const replayPayload = (await replayResponse.json()) as typeof initialReplay;
      setReplay(replayPayload);
    }

    const selfHealingResponse = await fetch(`/api/internal/executions/${initialExecution.id}/self-healing`, {
      cache: "no-store",
    });

    if (selfHealingResponse.ok) {
      const selfHealingPayload = (await selfHealingResponse.json()) as {
        records: typeof initialSelfHealingRecords;
      };
      setSelfHealingRecords(selfHealingPayload.records);
    }

    const memoryResponse = await fetch(
      `/api/internal/agents/${initialExecution.agentId}/memory?workflowId=${initialExecution.workflowId ?? ""}`,
      {
        cache: "no-store",
      },
    );
    if (memoryResponse.ok) {
      const memoryPayload = (await memoryResponse.json()) as {
        memory: typeof initialMemoryEntries;
      };
      setMemoryEntries(memoryPayload.memory);
    }
  }, [initialExecution.id, initialExecution.agentId, initialExecution.workflowId]);

  usePolling(refresh, 4000, execution.status === "RUNNING" || execution.status === "QUEUED");

  const mappedLogs = useMemo(
    () =>
      logs.map((item) => ({
        ...item,
        occurredAt: new Date(item.occurredAt),
      })),
    [logs],
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ExecutionStatusBadge status={execution.status} />
          <p className="text-xs text-slate-500">Auto-refresh enabled while execution is active</p>
        </div>
        {execution.status === "FAILED" ? <RetryExecutionButton executionId={execution.id} /> : null}
      </div>

      <DashboardCard title={`Execution ${execution.id.slice(-8)}`} description="Detailed execution telemetry">
        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Trigger</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{execution.trigger}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Agent</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{execution.agentId.slice(-8)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Workflow</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{execution.workflowId?.slice(-8) ?? "N/A"}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Logs</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{mappedLogs.length}</p>
          </article>
        </div>

        {execution.errorMessage ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Error</p>
            <p className="mt-1 text-sm text-rose-700">{execution.errorMessage}</p>
          </div>
        ) : null}

        {execution.outputPayload ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Output Payload</p>
            <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
              {JSON.stringify(execution.outputPayload, null, 2)}
            </pre>
          </div>
        ) : null}
      </DashboardCard>

      <DashboardCard title="Execution Timeline" description="Ordered events emitted during processing">
        <ExecutionLogTimeline logs={mappedLogs} />
      </DashboardCard>

      <DashboardCard
        title="Deterministic Replay"
        description="Stepwise replay with captured DOM snapshots for time-travel debugging"
      >
        <ExecutionReplayViewer steps={replay.steps} snapshots={replay.snapshots} />
      </DashboardCard>

      <DashboardCard title="Self-Healing Decisions" description="Selector fallback and semantic recovery actions">
        <SelfHealingPanel records={selfHealingRecords} />
      </DashboardCard>

      <DashboardCard title="Agent Memory Context" description="Learned patterns and failure resolutions reused by future runs">
        <AgentMemoryPanel entries={memoryEntries} />
      </DashboardCard>
    </>
  );
}
