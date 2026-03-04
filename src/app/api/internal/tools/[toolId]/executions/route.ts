import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchToolExecutions } from "@/server/services/tools/tool-registry-service";
import { learnFromToolExecution } from "@/server/services/tools/tool-learning-engine";

const bodySchema = z.object({
  status: z.enum(["SUCCEEDED", "FAILED"]),
  durationMs: z.number().int().min(0),
  executionId: z.string().optional(),
  errorMessage: z.string().optional(),
});

type RouteContext = {
  params: {
    toolId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const items = await fetchToolExecutions({
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

  await learnFromToolExecution({
    toolId: context.params.toolId,
    organizationId: user.organizationId!,
    status: data.status,
    durationMs: data.durationMs,
    executionId: data.executionId,
    errorMessage: data.errorMessage,
  });

  return NextResponse.json({ recorded: true }, { status: 201 });
}
