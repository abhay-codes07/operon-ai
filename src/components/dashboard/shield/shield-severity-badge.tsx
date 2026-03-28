type ShieldSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const severityClassName: Record<ShieldSeverity, string> = {
  LOW: "border-slate-600/40 bg-slate-700/30 text-slate-300",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  CRITICAL: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

type ShieldSeverityBadgeProps = {
  severity: ShieldSeverity;
  riskScore?: number;
};

export function ShieldSeverityBadge({ severity, riskScore }: ShieldSeverityBadgeProps): JSX.Element {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${severityClassName[severity]}`}>
      {severity}
      {typeof riskScore === "number" ? ` (${riskScore})` : ""}
    </span>
  );
}
