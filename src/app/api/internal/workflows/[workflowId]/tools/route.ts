import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchInstalledTools, installTool } from "@/server/services/tools/tool-registry-service";

const bodySchema = z.object({
  toolId: z.string().min(1),
  toolVersionId: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
});

type RouteContext = {
  params: {
    workflowId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const items = await fetchInstalledTools({
    organizationId: user.organizationId!,
    workflowId: context.params.workflowId,
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, bodySchema);
  if (error) {
    return error;
  }

  let installed;
  try {
    installed = await installTool({
      organizationId: user.organizationId!,
      workflowId: context.params.workflowId,
      toolId: data.toolId,
      toolVersionId: data.toolVersionId,
      installedById: user.id,
      config: data.config,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tool installation failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ installed }, { status: 201 });
}
