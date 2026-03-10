type FleetStatus = "RUNNING" | "IDLE" | "FAILED" | "RETRYING";
type HealthStatus = "HEALTHY" | "DEGRADED" | "CRITICAL";

const fleetStyle: Record<FleetStatus, string> = {
  RUNNING: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  IDLE: "bg-slate-100 text-slate-700 ring-slate-500/20",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-600/20",
  RETRYING: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const healthStyle: Record<HealthStatus, string> = {
  HEALTHY: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  DEGRADED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CRITICAL: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function FleetStatusBadge({ status }: { status: FleetStatus }): JSX.Element {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${fleetStyle[status]}`}>
      {status}
    </span>
  );
}

export function HealthStatusBadge({ status }: { status: HealthStatus }): JSX.Element {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${healthStyle[status]}`}>
      {status}
    </span>
  );
}
