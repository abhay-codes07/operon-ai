import { NextResponse } from "next/server";

import { createTraceId } from "@/server/observability/tracing";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { enqueueExecutionJob } from "@/server/queue/producers/execution-producer";
import { appendExecutionEvent, queueExecution } from "@/server/services/executions/execution-service";
import { fetchWorkflowById } from "@/server/services/workflows/workflow-service";

type RouteContext = {
  params: {
    workflowId: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const workflow = await fetchWorkflowById({
    organizationId: user.organizationId!,
    workflowId: context.params.workflowId,
  });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const execution = await queueExecution({
    organizationId: user.organizationId!,
    agentId: workflow.agentId,
    workflowId: workflow.id,
    requestedById: user.id,
    trigger: "MANUAL",
    inputPayload: {
      source: "dashboard",
      initiatedByUserId: user.id,
    },
  });
  const traceId = createTraceId(execution.id);

  await enqueueExecutionJob({
    organizationId: user.organizationId!,
    executionId: execution.id,
    workflowId: workflow.id,
    agentId: workflow.agentId,
    requestedById: user.id,
    trigger: "MANUAL",
    traceId,
  });

  await appendExecutionEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    level: "INFO",
    message: "Execution enqueued for background processing",
    metadata: {
      queue: "execution",
      traceId,
    },
  });

  return NextResponse.json(
    {
      executionId: execution.id,
      status: "QUEUED",
    },
    { status: 202 },
  );
}
