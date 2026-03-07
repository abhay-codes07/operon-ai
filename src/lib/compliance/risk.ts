import type { ComplianceActionType, ComplianceRiskLevel } from "@prisma/client";

export function computeComplianceRisk(actions: ComplianceActionType[]): ComplianceRiskLevel {
  if (actions.includes("WRITE") || actions.includes("SUBMIT")) {
    return "HIGH";
  }
  if (actions.includes("EXTRACT")) {
    return "MEDIUM";
  }
  return "LOW";
}
