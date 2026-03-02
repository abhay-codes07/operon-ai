import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionTimeline } from "@/server/services/executions/execution-service";

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);

  const timeline = await fetchExecutionTimeline({
    organizationId: user.organizationId!,
    executionId: context.params.executionId,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "50"),
  });

  return NextResponse.json(timeline);
}
