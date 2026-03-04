import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  retrieveToolById,
  retrieveToolVersions,
} from "@/server/services/tools/tool-registry-service";

type RouteContext = {
  params: {
    toolId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");

  const [tool, versions] = await Promise.all([
    retrieveToolById({
      organizationId: user.organizationId!,
      toolId: context.params.toolId,
    }),
    retrieveToolVersions({
      organizationId: user.organizationId!,
      toolId: context.params.toolId,
    }),
  ]);

  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json({
    tool,
    versions,
  });
}
