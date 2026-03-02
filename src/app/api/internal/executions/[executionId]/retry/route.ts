import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { enqueueExecutionJob } from "@/server/queue/producers/execution-producer";
import {
  appendExecutionEvent,
  fetchExecutionById,
  resetExecutionForRetry,
} from "@/server/services/executions/execution-service";

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const execution = await fetchExecutionById({
    organizationId: user.organizationId!,
    executionId: context.params.executionId,
  });

  if (!execution) {
    return NextResponse.json({ error: "Execution not found" }, { status: 404 });
  }

  if (!execution.workflowId) {
    return NextResponse.json({ error: "Execution has no workflow reference" }, { status: 400 });
  }

  const retriedExecution = await resetExecutionForRetry({
    organizationId: user.organizationId!,
    executionId: execution.id,
  });

  await enqueueExecutionJob({
    organizationId: user.organizationId!,
    executionId: retriedExecution.id,
    agentId: retriedExecution.agentId,
    workflowId: execution.workflowId,
    requestedById: user.id,
    trigger: "RETRY",
  });

  await appendExecutionEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    level: "WARN",
    message: "Execution requeued for retry",
    metadata: {
      requestedByUserId: user.id,
    },
  });

  return NextResponse.json(
    {
      executionId: execution.id,
      status: "QUEUED",
      trigger: "RETRY",
    },
    { status: 202 },
  );
}
