import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import {
  appendExecutionEvent,
  queueExecution,
} from "@/server/services/executions/execution-service";
import { createWorkflowTemplate } from "@/server/services/workflows/workflow-service";
import { triggerWorkers } from "@/lib/worker/trigger";

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

  // Resolve workflowId: use provided one, or auto-create a workflow from the task description
  let resolvedWorkflowId = data.workflowId;
  if (!resolvedWorkflowId) {
    const task = data.taskOverride?.trim() || "Extract information from the target website";
    // Ensure task meets min(10) length requirement
    const normalizedTask = task.length >= 10 ? task : `${task} (swarm task)`;
    const firstUrl = data.targetUrls[0] ?? "the target website";
    const workflow = await createWorkflowTemplate({
      organizationId: user.organizationId!,
      agentId: data.agentId,
      createdById: user.id,
      name: `Swarm: ${normalizedTask.slice(0, 60)}`,
      definition: {
        naturalLanguageTask: normalizedTask,
        steps: [
          {
            id: crypto.randomUUID(),
            action: "Navigate and extract",
            target: firstUrl,
            expectedOutcome: "Extract the requested information from the page",
          },
        ],
        guardrails: [],
        timeoutSeconds: 120,
        retryLimit: 1,
      },
    });
    resolvedWorkflowId = workflow.id;
  }

  const executions = await Promise.all(
    data.targetUrls.map(async (targetUrl) => {
      const execution = await queueExecution({
        organizationId: user.organizationId!,
        agentId: data.agentId,
        workflowId: resolvedWorkflowId,
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

  // Trigger workers server-side (independent Vercel invocations, not cancelled on navigation)
  triggerWorkers(executions.map((e) => e.executionId));

  return NextResponse.json({ swarmId, executions }, { status: 201 });
}
