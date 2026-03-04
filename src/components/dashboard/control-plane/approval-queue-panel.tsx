"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ApprovalItem = {
  id: string;
  executionId?: string | null;
  stepKey?: string | null;
  actionType: string;
  requestedAt: string;
};

type ApprovalQueuePanelProps = {
  items: ApprovalItem[];
};

export function ApprovalQueuePanel({ items }: ApprovalQueuePanelProps): JSX.Element {
  const [queue, setQueue] = useState(items);

  async function review(id: string, approve: boolean, executionId?: string | null) {
    await fetch(`/api/internal/approvals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approve,
        executionId: executionId ?? undefined,
      }),
    });

    setQueue((current) => current.filter((item) => item.id !== id));
  }

  if (queue.length === 0) {
    return <p className="text-sm text-slate-600">No pending approval requests.</p>;
  }

  return (
    <div className="space-y-3">
      {queue.map((item) => (
        <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.actionType}</p>
          <p className="mt-1 text-sm text-slate-900">
            Execution {item.executionId?.slice(-8) ?? "N/A"} • Step {item.stepKey ?? "N/A"}
          </p>
          <p className="text-xs text-slate-500">{new Date(item.requestedAt).toLocaleString()}</p>
          <div className="mt-3 flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => review(item.id, true, item.executionId)}>
              Approve
            </Button>
            <Button type="button" variant="ghost" onClick={() => review(item.id, false, item.executionId)}>
              Reject
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
