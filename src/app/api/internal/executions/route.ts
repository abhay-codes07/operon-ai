import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  appendExecutionEvent,
  fetchExecutionHistory,
  queueExecution,
} from "@/server/services/executions/execution-service";

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);

  const executions = await fetchExecutionHistory({
    organizationId: user.organizationId!,
    status:
      searchParams.get("status") === "QUEUED" ||
      searchParams.get("status") === "RUNNING" ||
      searchParams.get("status") === "SUCCEEDED" ||
      searchParams.get("status") === "FAILED" ||
      searchParams.get("status") === "CANCELED"
        ? (searchParams.get("status") as "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED")
        : undefined,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
  });

  return NextResponse.json(executions);
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const body = (await request.json().catch(() => null)) as
    | {
        agentId?: string;
        workflowId?: string;
        trigger?: "MANUAL" | "SCHEDULED" | "API" | "RETRY";
        inputPayload?: Record<string, unknown>;
      }
    | null;

  if (!body?.agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  const execution = await queueExecution({
    organizationId: user.organizationId!,
    agentId: body.agentId,
    workflowId: body.workflowId,
    requestedById: user.id,
    trigger: body.trigger,
    inputPayload: body.inputPayload,
  });

  await appendExecutionEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    level: "INFO",
    message: "Execution queued",
  });

  return NextResponse.json(execution, { status: 201 });
}
