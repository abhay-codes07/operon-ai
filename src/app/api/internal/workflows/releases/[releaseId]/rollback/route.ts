import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { rollbackRelease } from "@/server/services/workflows/release-manager-service";

const paramsSchema = z.object({
  releaseId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    releaseId: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid release identifier" }, { status: 400 });
  }

  await rollbackRelease({
    organizationId: user.organizationId!,
    releaseId: parsed.data.releaseId,
  });

  return NextResponse.json({ ok: true });
}
