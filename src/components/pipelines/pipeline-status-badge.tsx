type PipelineStatus = "RUNNING" | "PAUSED" | "FAILED" | "COMPLETED";

type PipelineStatusBadgeProps = {
  status: PipelineStatus;
};

const statusClassMap: Record<PipelineStatus, string> = {
  RUNNING: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  PAUSED: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  FAILED: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  COMPLETED: "border-slate-600/40 bg-slate-700/30 text-slate-300",
};

export function PipelineStatusBadge({ status }: PipelineStatusBadgeProps): JSX.Element {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassMap[status]}`}>
      {status}
    </span>
  );
}
