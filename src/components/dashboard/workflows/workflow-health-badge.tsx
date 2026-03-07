type WorkflowHealthState = "HEALTHY" | "WARNING" | "BREACHED";

const style: Record<WorkflowHealthState, string> = {
  HEALTHY: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  WARNING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  BREACHED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function WorkflowHealthBadge({ state }: { state: WorkflowHealthState }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style[state]}`}
    >
      {state}
    </span>
  );
}
