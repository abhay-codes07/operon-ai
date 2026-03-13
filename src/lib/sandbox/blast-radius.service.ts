import { prisma } from "@/server/db/client";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateBlastRadiusScore(input: {
  authenticatedDomains: number;
  credentialScope: "DOMAIN" | "MULTI_DOMAIN";
  privilegeLevel: "LOW" | "MEDIUM" | "HIGH";
  isolationLevel: "STRONG" | "MODERATE" | "WEAK";
}) {
  let score = 10;

  score += Math.min(40, input.authenticatedDomains * 8);
  score += input.credentialScope === "DOMAIN" ? 5 : 20;
  score += input.privilegeLevel === "LOW" ? 5 : input.privilegeLevel === "MEDIUM" ? 18 : 30;
  score += input.isolationLevel === "STRONG" ? -10 : input.isolationLevel === "MODERATE" ? 5 : 18;

  return clampScore(score);
}

export async function recordBlastRadiusScore(input: {
  organizationId: string;
  workflowId: string;
  authenticatedDomains: number;
  credentialScope: "DOMAIN" | "MULTI_DOMAIN";
  privilegeLevel: "LOW" | "MEDIUM" | "HIGH";
  isolationLevel: "STRONG" | "MODERATE" | "WEAK";
}) {
  const score = calculateBlastRadiusScore(input);
  return prisma.blastRadiusScore.create({
    data: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      score,
      factors: {
        authenticatedDomains: input.authenticatedDomains,
        credentialScope: input.credentialScope,
        privilegeLevel: input.privilegeLevel,
        isolationLevel: input.isolationLevel,
      },
    },
  });
}

export async function latestBlastRadiusForWorkflow(workflowId: string) {
  return prisma.blastRadiusScore.findFirst({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
  });
}
