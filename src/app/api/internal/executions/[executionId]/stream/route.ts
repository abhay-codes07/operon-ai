import { NextResponse } from "next/server";
import { z } from "zod";

import { parsePositiveInt } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionStream } from "@/server/services/control-plane/streaming-service";

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
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid execution identifier" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const sinceSequence = parsePositiveInt(searchParams.get("sinceSequence"), 0, {
    min: 0,
    max: 1_000_000,
  });

  const items = await fetchExecutionStream({
    organizationId: user.organizationId!,
    executionId: parsed.data.executionId,
    sinceSequence: sinceSequence === 0 ? undefined : sinceSequence,
  });

  return NextResponse.json({ items });
}
