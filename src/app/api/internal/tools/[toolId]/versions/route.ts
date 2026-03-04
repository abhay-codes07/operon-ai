import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { retrieveToolVersions, versionTool } from "@/server/services/tools/tool-registry-service";

const bodySchema = z.object({
  workflowSteps: z.array(
    z.object({
      id: z.string().min(1),
      action: z.string().min(1),
      target: z.string().optional(),
      expectedOutcome: z.string().optional(),
    }),
  ),
  notes: z.string().optional(),
});

type RouteContext = {
  params: {
    toolId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const items = await retrieveToolVersions({
    organizationId: user.organizationId!,
    toolId: context.params.toolId,
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, bodySchema);
  if (error) {
    return error;
  }

  const version = await versionTool({
    organizationId: user.organizationId!,
    toolId: context.params.toolId,
    workflowSteps: data.workflowSteps,
    notes: data.notes,
  });

  return NextResponse.json({ version }, { status: 201 });
}
