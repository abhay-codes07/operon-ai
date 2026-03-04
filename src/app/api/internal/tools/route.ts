import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { generateToolFromExecutionFailure } from "@/server/services/tools/tool-generation-service";
import { registerTool, retrieveToolCatalog } from "@/server/services/tools/tool-registry-service";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(1000),
  createdByAgentId: z.string().optional(),
  workflowSteps: z.array(
    z.object({
      id: z.string().min(1),
      action: z.string().min(1),
      target: z.string().optional(),
      expectedOutcome: z.string().optional(),
    }),
  ),
  notes: z.string().optional(),
  generateFromExecutionId: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? undefined;

  const items = await retrieveToolCatalog({
    organizationId: user.organizationId!,
    query,
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, registerSchema);
  if (error) {
    return error;
  }

  if (data.generateFromExecutionId) {
    const generated = await generateToolFromExecutionFailure({
      organizationId: user.organizationId!,
      agentId: data.createdByAgentId,
      executionId: data.generateFromExecutionId,
    });
    return NextResponse.json(generated, { status: 201 });
  }

  const tool = await registerTool({
    organizationId: user.organizationId!,
    createdByAgentId: data.createdByAgentId,
    name: data.name,
    description: data.description,
    workflowSteps: data.workflowSteps,
    notes: data.notes,
  });

  return NextResponse.json({ tool }, { status: 201 });
}
