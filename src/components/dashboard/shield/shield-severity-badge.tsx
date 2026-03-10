type ShieldSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const severityClassName: Record<ShieldSeverity, string> = {
  LOW: "border-slate-200 bg-slate-100 text-slate-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
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
