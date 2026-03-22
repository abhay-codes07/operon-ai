"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type IncidentItem = {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  detectedAt: string;
  agentId?: string | null;
  executionId?: string | null;
  events: Array<{ id: string; eventType: string; message: string; occurredAt: string }>;
};

const severityClass: Record<IncidentItem["severity"], string> = {
  LOW: "text-slate-300",
  MEDIUM: "text-amber-700",
  HIGH: "text-orange-700",
  CRITICAL: "text-rose-700",
};

export function IncidentAlertPanel({ items }: { items: IncidentItem[] }): JSX.Element {
  const [queue, setQueue] = useState(items);

  async function resolve(incidentId: string) {
    const response = await fetch(`/api/internal/mission-control/incidents/${incidentId}/resolve`, {
      method: "POST",
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    setQueue((current) =>
      current.map((item) => (item.id === incidentId ? { ...item, status: "RESOLVED" } : item)),
    );
  }

  if (queue.length === 0) {
    return <p className="text-sm text-slate-400">No active incidents.</p>;
  }

  return (
    <div className="space-y-3">
      {queue.map((incident) => (
        <article key={incident.id} className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${severityClass[incident.severity]}`}>
                {incident.severity}
              </p>
              <h3 className="text-sm font-semibold text-white">{incident.title}</h3>
            </div>
            <p className="text-xs text-slate-500">{new Date(incident.detectedAt).toLocaleString()}</p>
          </div>
          <p className="mt-2 text-sm text-slate-300">{incident.description}</p>
          <p className="mt-1 text-xs text-slate-500">
            Agent {incident.agentId?.slice(-8) ?? "N/A"} • Execution {incident.executionId?.slice(-8) ?? "N/A"}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Status: {incident.status}</p>
            {incident.status !== "RESOLVED" ? (
              <Button type="button" variant="secondary" onClick={() => resolve(incident.id)}>
                Resolve
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
