import { prisma } from "@/server/db/client";

export async function notifyCoPilotHelpRequested(input: {
  organizationId: string;
  executionId: string;
  sessionId: string;
  stepId: string;
  reasons: string[];
}) {
  return prisma.executionLog.create({
    data: {
      executionId: input.executionId,
      organizationId: input.organizationId,
      level: "WARN",
      message: "Co-Pilot requested human assistance",
      metadata: {
        sessionId: input.sessionId,
        stepId: input.stepId,
        reasons: input.reasons,
      },
    },
  });
}
