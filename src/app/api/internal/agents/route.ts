import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  fetchAgentCatalog,
  provisionAgent,
} from "@/server/services/agents/agent-service";

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  const agents = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    status:
      status === "DRAFT" || status === "ACTIVE" || status === "PAUSED" || status === "ARCHIVED"
        ? status
        : undefined,
    page,
    pageSize,
  });

  return NextResponse.json(agents);
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const body = (await request.json().catch(() => null)) as
    | { name?: string; description?: string }
    | null;

  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const agent = await provisionAgent({
    organizationId: user.organizationId!,
    createdById: user.id,
    name: body.name,
    description: body.description,
  });

  return NextResponse.json(agent, { status: 201 });
}
