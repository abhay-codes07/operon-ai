import { prisma } from "@/server/db/client";

export async function simulateSandboxAttack(input: {
  organizationId: string;
  workflowId: string;
  identityId: string;
  attemptedDomain: string;
}) {
  const blocked = true;

  await prisma.blastRadiusScore.create({
    data: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      score: 4,
      factors: {
        simulation: "prompt_injection_exfiltration",
        attemptedDomain: input.attemptedDomain,
        blocked,
      },
    },
  }).catch(() => null);

  return {
    blocked,
    attemptedExfiltration: {
      domain: input.attemptedDomain,
      identityId: input.identityId,
    },
    containment: "isolated_sandbox_identity",
  };
}
