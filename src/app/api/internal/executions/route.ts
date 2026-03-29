import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody, parsePositiveInt } from "@/server/api/validation";
import {
  appendExecutionEvent,
  fetchExecutionHistory,
  queueExecution,
} from "@/server/services/executions/execution-service";

const executionStatusSchema = z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELED"]);
const triggerSchema = z.enum(["MANUAL", "SCHEDULED", "API", "RETRY"]);
const createExecutionSchema = z.object({
  agentId: z.string().trim().min(1),
  workflowId: z.string().trim().min(1).optional(),
  trigger: triggerSchema.optional(),
  inputPayload: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);

  const executions = await fetchExecutionHistory({
    organizationId: user.organizationId!,
    status: executionStatusSchema.safeParse(searchParams.get("status")).data,
    page: parsePositiveInt(searchParams.get("page"), 1, { min: 1, max: 1_000 }),
    pageSize: parsePositiveInt(searchParams.get("pageSize"), 20, { min: 1, max: 100 }),
  });

  return NextResponse.json(executions);
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, createExecutionSchema);
  if (error) {
    return error;
  }

  const execution = await queueExecution({
    organizationId: user.organizationId!,
    agentId: data.agentId,
    workflowId: data.workflowId,
    requestedById: user.id,
    trigger: data.trigger,
    inputPayload: data.inputPayload,
  });

  await appendExecutionEvent({
    organizationId: user.organizationId!,
    executionId: execution.id,
    level: "INFO",
    message: "Execution queued",
  });

  // Immediately trigger the worker to process this execution without waiting for the cron
  const baseUrl = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (baseUrl) {
    const workerUrl = `${baseUrl}/api/worker/run`;
    const headers: Record<string, string> = {};
    if (process.env.CRON_SECRET) {
      headers["authorization"] = `Bearer ${process.env.CRON_SECRET}`;
    }
    fetch(workerUrl, { headers }).catch(() => null);
  }

  return NextResponse.json(execution, { status: 201 });
}
