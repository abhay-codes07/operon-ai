"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

import { FleetStatusBadge, HealthStatusBadge } from "./fleet-status-badge";
import { IncidentAlertPanel } from "./incident-alert-panel";
import { OperationalMetricsDashboard } from "./operational-metrics-dashboard";

type FleetItem = {
  id: string;
  name: string;
  updatedAt: string;
  status: "RUNNING" | "IDLE" | "FAILED" | "RETRYING";
  statusReason?: string | null;
  statusAt: string;
  healthStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  health?: {
    cpuLoadPct?: number | null;
    memoryUsageMb?: number | null;
    queueBacklog?: number | null;
    successRateWindow?: number | null;
  } | null;
};

type MissionControlDashboardProps = {
  initialFleet: FleetItem[];
  initialIncidents: Array<{
    id: string;
    title: string;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    detectedAt: string;
    agentId?: string | null;
    executionId?: string | null;
    events: Array<{ id: string; eventType: string; message: string; occurredAt: string }>;
  }>;
  initialMetrics: {
    runsPerHour: number;
    successRate: number;
    incidentCount: number;
    averageExecutionSeconds: number;
  };
};

export function MissionControlDashboard({
  initialFleet,
  initialIncidents,
  initialMetrics,
}: MissionControlDashboardProps): JSX.Element {
  const [fleet, setFleet] = useState(initialFleet);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [metrics, setMetrics] = useState(initialMetrics);

  const refresh = useCallback(async () => {
    const [fleetResponse, incidentsResponse, metricsResponse] = await Promise.all([
      fetch("/api/internal/mission-control/fleet", { cache: "no-store" }),
      fetch("/api/internal/mission-control/incidents", { cache: "no-store" }),
      fetch("/api/internal/mission-control/metrics?hours=24", { cache: "no-store" }),
    ]);

    if (fleetResponse.ok) {
      const payload = (await fleetResponse.json()) as { fleet: FleetItem[] };
      setFleet(
        payload.fleet.map((item) => ({
          ...item,
          updatedAt: new Date(item.updatedAt).toISOString(),
          statusAt: new Date(item.statusAt).toISOString(),
        })),
      );
    }

    if (incidentsResponse.ok) {
      const payload = (await incidentsResponse.json()) as {
        incidents: MissionControlDashboardProps["initialIncidents"];
      };
      setIncidents(payload.incidents);
    }

    if (metricsResponse.ok) {
      const payload = (await metricsResponse.json()) as MissionControlDashboardProps["initialMetrics"];
      setMetrics(payload);
    }
  }, []);

  usePolling(refresh, 6000, true);

  return (
    <div className="space-y-4">
      <OperationalMetricsDashboard metrics={metrics} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr,1fr]">
        <section className="rounded-xl border border-slate-700/60 bg-slate-900 p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">Fleet Status</h3>
            <p className="text-xs text-slate-500">Live state for deployed agents.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-700/60">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Agent</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Health</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-700">
                {fleet.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-3 py-2">
                      <Link href={`/dashboard/agents`} className="font-medium text-white hover:underline">
                        {agent.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <FleetStatusBadge status={agent.status} />
                    </td>
                    <td className="px-3 py-2">
                      <HealthStatusBadge status={agent.healthStatus} />
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {new Date(agent.updatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700/60 bg-slate-900 p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">Incident Alerts</h3>
            <p className="text-xs text-slate-500">Detected anomalies and operator resolution queue.</p>
          </div>
          <IncidentAlertPanel items={incidents} />
        </section>
      </div>
    </div>
  );
}
