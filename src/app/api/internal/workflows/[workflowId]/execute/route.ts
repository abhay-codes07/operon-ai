import { NextResponse } from "next/server";
import { z } from "zod";

import { createTraceId } from "@/server/observability/tracing";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { enqueueExecutionJob } from "@/server/queue/producers/execution-producer";
import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";
import { isAgentExecutionEnabled } from "@/server/services/control-plane/system-flag-service";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { evaluateWorkflowAgainstPolicy } from "@/server/security/policy-engine";
import { enforceExecutionQuotaOrThrow } from "@/server/services/billing/enforcement-service";
import { appendExecutionEvent, queueExecution } from "@/server/services/executions/execution-service";
import {
  registerReleaseRouting,
  resolveWorkflowForExecution,
} from "@/server/services/workflows/release-manager-service";
import { fetchWorkflowById } from "@/server/services/workflows/workflow-service";

const paramsSchema = z.object({
  workflowId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    workflowId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const executionEnabled = await isAgentExecutionEnabled();
  if (!executionEnabled) {
    return NextResponse.json(
      {
        error: "Global kill switch is active. Agent execution is temporarily disabled.",
      },
      { status: 503 },
    );
  }

  const throttleResponse = enforceRateLimit(
    request,
    "executions:trigger",
    { maxRequests: 30, windowMs: 60_000 },
    user.id,
  );
  if (throttleResponse) {
    return throttleResponse;
  }

  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid workflow identifier" }, { status: 400 });
  }

  const workflow = await fetchWorkflowById({
    organizationId: user.organizationId!,
    workflowId: parsedParams.data.workflowId,
  });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const routing = await resolveWorkflowForExecution({
    organizationId: user.organizationId!,
    workflowId: workflow.id,
  });
  const selectedWorkflow =
    routing.workflowId === workflow.id
      ? workflow
      : await fetchWorkflowById({
          organizationId: user.organizationId!,
          workflowId: routing.workflowId,
        });
  if (!selectedWorkflow) {
    return NextResponse.json({ error: "Routed workflow not found" }, { status: 404 });
  }

  const policyEvaluation = await evaluateWorkflowAgainstPolicy({
    organizationId: user.organizationId!,
    workflowId: selectedWorkflow.id,
    definition:
      selectedWorkflow.definition as { steps?: Array<{ action?: string; target?: string }> } | null,
  });
  if (!policyEvaluation.allowed) {
    return NextResponse.json(
      {
        error: "Workflow violates organization security policy",
        reasons: policyEvaluation.reasons,
      },
      { status: 403 },
    );
  }

  try {
    await enforceExecutionQuotaOrThrow({ organizationId: user.organizationId! });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    throw error;
  }

  const execution = await queueExecution({
    organizationId: user.organizationId!,
    agentId: selectedWorkflow.agentId,
    workflowId: selectedWorkflow.id,
    requestedById: user.id,
    trigger: "MANUAL",
    inputPayload: {
      source: "dashboard",
      initiatedByUserId: user.id,
      requestedWorkflowId: workflow.id,
      routedWorkflowId: selectedWorkflow.id,
      releaseId: routing.releaseId,
      releaseLane: routing.lane,
    },
  });
  const traceId = createTraceId(execution.id);

  await enqueueExecutionJob({
    organizationId: user.organizationId!,
    executionId: execution.id,
    workflowId: selectedWorkflow.id,
    agentId: selectedWorkflow.agentId,
    requestedById: user.id,
    trigger: "MANUAL",
    traceId,
  });
  if (routing.releaseId) {
    await registerReleaseRouting({
      organizationId: user.organizationId!,
      releaseId: routing.releaseId,
      executionId: execution.id,
      workflowId: selectedWorkflow.id,
      lane: routing.lane,
    });
  }

  await appendExecutionEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    level: "INFO",
    message: "Execution enqueued for background processing",
    metadata: {
      queue: "execution",
      traceId,
      releaseId: routing.releaseId,
      releaseLane: routing.lane,
      routedWorkflowId: selectedWorkflow.id,
    },
  });

  await publishExecutionStreamEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    eventType: "execution.enqueued",
    payload: {
      workflowId: selectedWorkflow.id,
      requestedWorkflowId: workflow.id,
      releaseId: routing.releaseId,
      releaseLane: routing.lane,
      trigger: "MANUAL",
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
