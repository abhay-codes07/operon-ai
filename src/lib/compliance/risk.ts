type ComplianceActionType = "READ" | "WRITE" | "SUBMIT" | "EXTRACT";
type ComplianceRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export function computeComplianceRisk(actions: ComplianceActionType[]): ComplianceRiskLevel {
  if (actions.includes("WRITE") || actions.includes("SUBMIT")) {
    return "HIGH";
  }
  if (actions.includes("EXTRACT")) {
    return "MEDIUM";
  }
  return "LOW";
}
