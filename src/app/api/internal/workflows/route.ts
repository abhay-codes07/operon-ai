import { NextResponse } from "next/server";
import { z } from "zod";

import { createWorkflowRequestSchema } from "@/modules/workflows/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody, parsePositiveInt } from "@/server/api/validation";
import {
  createWorkflowFromTask,
  fetchWorkflowCatalog,
} from "@/server/services/workflows/workflow-service";

const workflowStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);

  const workflows = await fetchWorkflowCatalog({
    organizationId: user.organizationId!,
    agentId: searchParams.get("agentId") ?? undefined,
    query: searchParams.get("query") ?? undefined,
    status: workflowStatusSchema.safeParse(searchParams.get("status")).data,
    page: parsePositiveInt(searchParams.get("page"), 1, { min: 1, max: 1_000 }),
    pageSize: parsePositiveInt(searchParams.get("pageSize"), 20, { min: 1, max: 100 }),
  });

  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, createWorkflowRequestSchema);
  if (error) {
    return error;
  }

  const workflow = await createWorkflowFromTask({
    organizationId: user.organizationId!,
    createdById: user.id,
    payload: data,
  });

  return NextResponse.json(workflow, { status: 201 });
}
