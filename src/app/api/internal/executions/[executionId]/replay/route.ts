import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionReplay } from "@/server/services/executions/replay-service";

const paramsSchema = z.object({
  executionId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsedParams = paramsSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid execution identifier" }, { status: 400 });
  }

  const replay = await fetchExecutionReplay({
    organizationId: user.organizationId!,
    executionId: parsedParams.data.executionId,
  });

  return NextResponse.json(replay);
}
