import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parsePositiveInt } from "@/server/api/validation";
import { fetchExecutionTimeline } from "@/server/services/executions/execution-service";

const paramsSchema = z.object({
  executionId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid execution identifier" }, { status: 400 });
  }

  const timeline = await fetchExecutionTimeline({
    organizationId: user.organizationId!,
    executionId: parsedParams.data.executionId,
    page: parsePositiveInt(searchParams.get("page"), 1, { min: 1, max: 1_000 }),
    pageSize: parsePositiveInt(searchParams.get("pageSize"), 50, { min: 1, max: 200 }),
  });

  return NextResponse.json(timeline);
}
