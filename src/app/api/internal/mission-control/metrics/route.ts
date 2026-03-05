import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchOperationalMetrics } from "@/server/services/mission-control/metrics-service";

const searchParamsSchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).optional(),
});

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = searchParamsSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const metrics = await fetchOperationalMetrics({
    organizationId: user.organizationId!,
    hours: parsed.data.hours,
  });

  return NextResponse.json(metrics);
}
