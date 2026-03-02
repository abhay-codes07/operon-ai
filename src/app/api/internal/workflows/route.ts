import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  createWorkflowTemplate,
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
  const body = (await request.json().catch(() => null)) as
    | {
        agentId?: string;
        name?: string;
        description?: string;
        scheduleCron?: string;
        definition?: Record<string, unknown>;
      }
    | null;

  if (!body?.agentId || !body?.name || !body.definition) {
    return NextResponse.json({ error: "agentId, name, and definition are required" }, { status: 400 });
  }

  const workflow = await createWorkflowTemplate({
    organizationId: user.organizationId!,
    createdById: user.id,
    agentId: body.agentId,
    name: body.name,
    description: body.description,
    scheduleCron: body.scheduleCron,
    definition: body.definition,
  });

  return NextResponse.json(workflow, { status: 201 });
}
