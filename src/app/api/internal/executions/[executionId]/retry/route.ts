import { NextResponse } from "next/server";
import { z } from "zod";

import { createTraceId } from "@/server/observability/tracing";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { enqueueExecutionJob } from "@/server/queue/producers/execution-producer";
import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";
import { enforceRateLimit } from "@/server/security/rate-limit";
import {
  appendExecutionEvent,
  fetchExecutionById,
  resetExecutionForRetry,
} from "@/server/services/executions/execution-service";

const paramsSchema = z.object({
  executionId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const throttleResponse = enforceRateLimit(
    request,
    "executions:retry",
    { maxRequests: 15, windowMs: 60_000 },
    user.id,
  );
  if (throttleResponse) {
    return throttleResponse;
  }

  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid execution identifier" }, { status: 400 });
  }

  const execution = await fetchExecutionById({
    organizationId: user.organizationId!,
    executionId: parsedParams.data.executionId,
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
  const traceId = createTraceId(`${retriedExecution.id}:retry`);

  await enqueueExecutionJob({
    organizationId: user.organizationId!,
    executionId: retriedExecution.id,
    agentId: retriedExecution.agentId,
    workflowId: execution.workflowId,
    requestedById: user.id,
    trigger: "RETRY",
    traceId,
  });

  await appendExecutionEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    level: "WARN",
    message: "Execution requeued for retry",
    metadata: {
      requestedByUserId: user.id,
      traceId,
    },
  });

  await publishExecutionStreamEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    eventType: "execution.retry.enqueued",
    payload: {
      traceId,
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
