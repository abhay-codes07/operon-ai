"use client";

import { useState } from "react";

type IncidentRow = {
  id: string;
  workflowId: string;
  workflowName: string;
  runId?: string | null;
  breachType: "FAILURE_RATE" | "EXECUTION_TIMEOUT" | "MISSED_SCHEDULE";
  breachDetails: Record<string, unknown>;
  detectedAt: string;
  resolvedAt?: string | null;
};

type IncidentCenterTableProps = {
  items: IncidentRow[];
};

export function IncidentCenterTable({ items }: IncidentCenterTableProps): JSX.Element {
  const [rows, setRows] = useState(items);
  const [openDetails, setOpenDetails] = useState<string | null>(null);

  async function resolve(id: string) {
    await fetch(`/api/incidents/${id}/resolve`, { method: "POST" });
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, resolvedAt: new Date().toISOString() } : row)),
    );
  }

  async function retry(runId?: string | null) {
    if (!runId) {
      return;
    }
    await fetch(`/api/internal/executions/${runId}/retry`, { method: "POST" });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">No SLA incidents.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60">
      <table className="min-w-full divide-y divide-slate-800 bg-slate-900">
        <thead className="bg-slate-900/60">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Breach Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Detected</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{row.workflowName}</td>
              <td className="px-4 py-3">{row.breachType}</td>
              <td className="px-4 py-3">{new Date(row.detectedAt).toLocaleString()}</td>
              <td className="px-4 py-3">{row.resolvedAt ? "RESOLVED" : "OPEN"}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {row.runId ? (
                    <button
                      type="button"
                      className="rounded border border-slate-700/60 px-2 py-1 text-xs text-slate-300"
                      onClick={() => retry(row.runId)}
                    >
                      Retry Workflow
                    </button>
                  ) : null}
                  {!row.resolvedAt ? (
                    <button
                      type="button"
                      className="rounded border border-slate-700/60 px-2 py-1 text-xs text-slate-300"
                      onClick={() => resolve(row.id)}
                    >
                      Resolve
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => setOpenDetails((current) => (current === row.id ? null : row.id))}
                  >
                    {openDetails === row.id ? "Hide Details" : "View Details"}
                  </button>
                </div>
                {openDetails === row.id ? (
                  <pre className="mt-2 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-100">
                    {JSON.stringify(row.breachDetails, null, 2)}
                  </pre>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
