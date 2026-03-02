import Link from "next/link";

import { RetryExecutionButton } from "@/components/dashboard/activity/retry-execution-button";
import { ExecutionStatusBadge } from "@/components/dashboard/status/execution-status-badge";

type ExecutionListItem = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  trigger: "MANUAL" | "SCHEDULED" | "API" | "RETRY";
  agentId: string;
  createdAt: Date;
};

type ExecutionTimelineListProps = {
  items: ExecutionListItem[];
};

export function ExecutionTimelineList({ items }: ExecutionTimelineListProps): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">No execution activity yet</p>
        <p className="mt-1 text-sm text-slate-600">Trigger a workflow to populate timeline events.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((execution) => (
        <article key={execution.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/dashboard/activity/${execution.id}`}
                className="text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
              >
                Execution {execution.id.slice(-8)}
              </Link>
              <p className="text-xs text-slate-500">
                Agent {execution.agentId.slice(-8)} • {execution.trigger}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExecutionStatusBadge status={execution.status} />
              {execution.status === "FAILED" ? <RetryExecutionButton executionId={execution.id} compact /> : null}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
            }).format(execution.createdAt)}
          </p>
        </article>
      ))}
    </div>
  );
}
