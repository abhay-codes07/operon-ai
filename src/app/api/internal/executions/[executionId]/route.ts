import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionById } from "@/server/services/executions/execution-service";

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");

  const execution = await fetchExecutionById({
    organizationId: user.organizationId!,
    executionId: context.params.executionId,
  });

  if (!execution) {
    return NextResponse.json({ error: "Execution not found" }, { status: 404 });
  }

  return NextResponse.json(execution);
}
