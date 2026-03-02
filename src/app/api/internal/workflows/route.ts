import { NextResponse } from "next/server";

import { createWorkflowRequestSchema } from "@/modules/workflows/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  createWorkflowFromTask,
  fetchWorkflowCatalog,
} from "@/server/services/workflows/workflow-service";

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);

  const workflows = await fetchWorkflowCatalog({
    organizationId: user.organizationId!,
    agentId: searchParams.get("agentId") ?? undefined,
    status:
      searchParams.get("status") === "DRAFT" ||
      searchParams.get("status") === "ACTIVE" ||
      searchParams.get("status") === "PAUSED" ||
      searchParams.get("status") === "ARCHIVED"
        ? (searchParams.get("status") as "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED")
        : undefined,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
  });

  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const body = await request.json().catch(() => null);
  const parsed = createWorkflowRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid workflow payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const workflow = await createWorkflowFromTask({
    organizationId: user.organizationId!,
    createdById: user.id,
    payload: parsed.data,
  });

  return NextResponse.json(workflow, { status: 201 });
}
