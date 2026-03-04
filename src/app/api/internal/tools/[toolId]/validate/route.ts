import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { validateToolDefinition } from "@/server/services/tools/tool-validation-service";

const bodySchema = z.object({
  versionId: z.string().optional(),
});

type RouteContext = {
  params: {
    toolId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, bodySchema);
  if (error) {
    return error;
  }

  const result = await validateToolDefinition({
    organizationId: user.organizationId!,
    toolId: context.params.toolId,
    versionId: data.versionId,
  });

  return NextResponse.json({ result });
}
