type ComplianceRiskBadgeProps = {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

const riskStyle: Record<ComplianceRiskBadgeProps["riskLevel"], string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-rose-200 bg-rose-50 text-rose-700",
};

export function ComplianceRiskBadge({ riskLevel }: ComplianceRiskBadgeProps): JSX.Element {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${riskStyle[riskLevel]}`}>
      {riskLevel}
    </span>
  );
}
