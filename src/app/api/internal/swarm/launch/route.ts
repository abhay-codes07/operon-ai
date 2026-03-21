import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import {
  appendExecutionEvent,
  queueExecution,
} from "@/server/services/executions/execution-service";

const swarmLaunchSchema = z.object({
  agentId: z.string().trim().min(1),
  workflowId: z.string().trim().min(1).optional(),
  targetUrls: z.array(z.string().trim().min(1)).min(1).max(50),
  taskOverride: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, swarmLaunchSchema);
  if (error) {
    return error;
  }

  const swarmId = crypto.randomUUID();

  const executions = await Promise.all(
    data.targetUrls.map(async (targetUrl) => {
      const execution = await queueExecution({
        organizationId: user.organizationId!,
        agentId: data.agentId,
        workflowId: data.workflowId,
        requestedById: user.id,
        trigger: "MANUAL",
        inputPayload: {
          swarmId,
          targetUrl,
          ...(data.taskOverride ? { taskOverride: data.taskOverride } : {}),
        },
      });

      await appendExecutionEvent({
        organizationId: user.organizationId!,
        executionId: execution.id,
        level: "INFO",
        message: `Swarm execution queued (swarmId: ${swarmId}, targetUrl: ${targetUrl})`,
      });

      return { executionId: execution.id, targetUrl };
    }),
  );

  return NextResponse.json({ swarmId, executions }, { status: 201 });
}
