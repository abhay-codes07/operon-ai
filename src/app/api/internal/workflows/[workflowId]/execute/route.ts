import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { queueExecution, setExecutionStatus, appendExecutionEvent } from "@/server/services/executions/execution-service";
import { runExecutionWithTinyFish } from "@/server/services/executions/tinyfish-execution-runner";
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

  try {
    const result = await runExecutionWithTinyFish({
      organizationId: user.organizationId!,
      executionId: execution.id,
      agentId: workflow.agentId,
      workflowId: workflow.id,
    });

    return NextResponse.json({
      executionId: execution.id,
      providerExecutionId: result.providerExecutionId,
      status: result.status,
    });
  } catch (error) {
    await setExecutionStatus({
      organizationId: user.organizationId!,
      executionId: execution.id,
      status: "FAILED",
    });

    await appendExecutionEvent({
      organizationId: user.organizationId!,
      executionId: execution.id,
      level: "ERROR",
      message: "TinyFish execution failed unexpectedly",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      {
        error: "Execution failed",
        executionId: execution.id,
      },
      { status: 502 },
    );
  }
}
