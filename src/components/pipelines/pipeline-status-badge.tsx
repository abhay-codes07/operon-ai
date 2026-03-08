type PipelineStatus = "RUNNING" | "PAUSED" | "FAILED" | "COMPLETED";

type PipelineStatusBadgeProps = {
  status: PipelineStatus;
};

const statusClassMap: Record<PipelineStatus, string> = {
  RUNNING: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAUSED: "border-amber-200 bg-amber-50 text-amber-700",
  FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function PipelineStatusBadge({ status }: PipelineStatusBadgeProps): JSX.Element {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassMap[status]}`}>
      {status}
    </span>
  );
}
