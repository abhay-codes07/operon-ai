"use client";

import { ShieldSeverityBadge } from "@/components/dashboard/shield/shield-severity-badge";

type ShieldEventItem = {
  id: string;
  url: string;
  domLocation: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  detectedAt: string;
  workflow: {
    id: string;
    name: string;
  };
  run: {
    id: string;
    status: string;
  };
};

type ShieldEventsTableProps = {
  items: ShieldEventItem[];
};

export function ShieldEventsTable({ items }: ShieldEventsTableProps): JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No prompt injection events detected.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e2d5a]/60">
      <table className="min-w-full divide-y divide-[#1e2d5a]/40 bg-[#0d1428]/80">
        <thead className="bg-[#060b18]/60">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Time</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Workflow</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Target</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Severity</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Run</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2d5a]/30">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-[#1e2d5a]/20">
              <td className="px-3 py-3 text-xs text-slate-400">{new Date(item.detectedAt).toLocaleString()}</td>
              <td className="px-3 py-3 text-sm font-medium text-white">{item.workflow.name}</td>
              <td className="px-3 py-3 text-xs text-slate-300">
                <p>{item.url}</p>
                {item.domLocation ? <p className="text-slate-500">{item.domLocation}</p> : null}
              </td>
              <td className="px-3 py-3">
                <ShieldSeverityBadge severity={item.severity} riskScore={item.riskScore} />
              </td>
              <td className="px-3 py-3 text-xs text-slate-400">
                {item.run.id.slice(-8)} ({item.run.status})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
