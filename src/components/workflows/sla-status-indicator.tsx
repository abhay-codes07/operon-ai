type SLAIndicatorState = "HEALTHY" | "WARNING" | "BREACHED" | "UNCONFIGURED";

const indicatorStyle: Record<SLAIndicatorState, string> = {
  HEALTHY: "bg-emerald-50 text-emerald-700",
  WARNING: "bg-amber-50 text-amber-700",
  BREACHED: "bg-rose-50 text-rose-700",
  UNCONFIGURED: "bg-slate-100 text-slate-700",
};

export function SLAStatusIndicator({ state }: { state: SLAIndicatorState }): JSX.Element {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${indicatorStyle[state]}`}>
      SLA {state}
    </span>
  );
}
