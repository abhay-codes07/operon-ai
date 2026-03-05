import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { resolveIncident } from "@/server/services/mission-control/incident-detection-service";

const paramsSchema = z.object({
  incidentId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    incidentId: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const parsedParams = paramsSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid incident identifier" }, { status: 400 });
  }

  await resolveIncident({
    organizationId: user.organizationId!,
    incidentId: parsedParams.data.incidentId,
  });

  return NextResponse.json({ ok: true });
}
