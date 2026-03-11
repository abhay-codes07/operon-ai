import { prisma } from "@/server/db/client";

export async function notifySelfRepairEvent(input: {
  orgId: string;
  runId: string;
  workflowId?: string;
  message: string;
  metadata: Record<string, unknown>;
}) {
  return prisma.executionLog.create({
    data: {
      executionId: input.runId,
      organizationId: input.orgId,
      level: "INFO",
      message: input.message,
      metadata: {
        source: "autopilot_alert",
        workflowId: input.workflowId,
        ...input.metadata,
      },
    },
  });
}
