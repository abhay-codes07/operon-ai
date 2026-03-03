import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody, parsePositiveInt } from "@/server/api/validation";
import {
  fetchAgentCatalog,
  provisionAgent,
} from "@/server/services/agents/agent-service";

const agentStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);
const createAgentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).optional(),
});

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);
  const status = agentStatusSchema.safeParse(searchParams.get("status")).data;
  const page = parsePositiveInt(searchParams.get("page"), 1, { min: 1, max: 1_000 });
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 20, { min: 1, max: 100 });

  const agents = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    status,
    page,
    pageSize,
  });

  return NextResponse.json(agents);
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, createAgentSchema);
  if (error) {
    return error;
  }

  const agent = await provisionAgent({
    organizationId: user.organizationId!,
    createdById: user.id,
    name: data.name,
    description: data.description,
  });

  return NextResponse.json(agent, { status: 201 });
}
