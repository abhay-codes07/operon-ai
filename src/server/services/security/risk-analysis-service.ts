import { countRecentAgentAudits } from "@/server/repositories/security/audit-repository";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function toRiskLevel(score: number): RiskLevel {
  if (score >= 80) {
    return "CRITICAL";
  }
  if (score >= 60) {
    return "HIGH";
  }
  if (score >= 35) {
    return "MEDIUM";
  }
  return "LOW";
}

export async function analyzeAgentActionRisk(input: {
  organizationId: string;
  agentId: string;
  targetDomain?: string | null;
  policyDenied: boolean;
}) {
  let score = 10;
  const reasons: string[] = [];
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentFailedCount = await countRecentAgentAudits({
    organizationId: input.organizationId,
    agentId: input.agentId,
    from: oneHourAgo,
    result: "FAILED",
  });
  if (recentFailedCount >= 3) {
    score += 30;
    reasons.push("Repeated failures in last hour");
  }

  const recentVolume = await countRecentAgentAudits({
    organizationId: input.organizationId,
    agentId: input.agentId,
    from: oneHourAgo,
  });
  if (recentVolume >= 80) {
    score += 25;
    reasons.push("Abnormal request volume");
  }

  if (input.policyDenied) {
    score += 30;
    reasons.push("Forbidden policy intent detected");
  }

  if (input.targetDomain && input.targetDomain.endsWith(".internal")) {
    score += 10;
    reasons.push("Restricted domain pattern");
  }

  const bounded = Math.min(100, score);
  const level = toRiskLevel(bounded);

  return {
    riskScore: bounded,
    riskLevel: level,
    riskReason: reasons.length === 0 ? "Normal operating profile" : reasons.join("; "),
  };
}
