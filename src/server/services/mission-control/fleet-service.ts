import {
  appendAgentHealthRecord,
  appendAgentStatusSnapshot,
  listFleetSnapshot,
} from "@/server/repositories/mission-control/fleet-repository";

type FleetStatus = "RUNNING" | "IDLE" | "FAILED" | "RETRYING";
type HealthStatus = "HEALTHY" | "DEGRADED" | "CRITICAL";

function toHealthStatusFromFleetStatus(status: FleetStatus): HealthStatus {
  if (status === "FAILED") {
    return "CRITICAL";
  }
  if (status === "RETRYING") {
    return "DEGRADED";
  }
  return "HEALTHY";
}

export async function recordAgentFleetStatus(input: {
  organizationId: string;
  agentId: string;
  status: FleetStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  const snapshot = await appendAgentStatusSnapshot(input);

  await appendAgentHealthRecord({
    organizationId: input.organizationId,
    agentId: input.agentId,
    status: toHealthStatusFromFleetStatus(input.status),
    queueBacklog: typeof input.metadata?.queueBacklog === "number" ? input.metadata.queueBacklog : undefined,
    successRateWindow:
      typeof input.metadata?.successRateWindow === "number" ? input.metadata.successRateWindow : undefined,
  });

  return snapshot;
}

export async function recordAgentHealth(input: {
  organizationId: string;
  agentId: string;
  status: HealthStatus;
  cpuLoadPct?: number;
  memoryUsageMb?: number;
  queueBacklog?: number;
  successRateWindow?: number;
}) {
  return appendAgentHealthRecord(input);
}

export async function fetchMissionFleetDashboard(organizationId: string) {
  const fleet = await listFleetSnapshot(organizationId);
  const counts = fleet.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { RUNNING: 0, IDLE: 0, FAILED: 0, RETRYING: 0 },
  );

  return {
    fleet,
    counts,
    totalAgents: fleet.length,
  };
}
