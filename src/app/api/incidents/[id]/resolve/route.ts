import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { resolveIncident } from "@/lib/sla/incident.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return structuredApiError(400, "INVALID_INCIDENT_ID", "Incident identifier is invalid");
  }

  const incident = await prisma.sLABreachIncident.findFirst({
    where: {
      id: parsed.data.id,
      organizationId: user.organizationId!,
    },
    select: { id: true },
  });
  if (!incident) {
    return structuredApiError(404, "INCIDENT_NOT_FOUND", "Incident not found");
  }

  const resolved = await resolveIncident(parsed.data.id);
  return NextResponse.json({ incident: resolved });
}
