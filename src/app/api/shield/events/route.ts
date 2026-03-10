import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listShieldEvents } from "@/lib/shield/event.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_QUERY", "Invalid shield events query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listShieldEvents({
      organizationId: user.organizationId!,
      limit: parsed.data.limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "SHIELD_EVENTS_FETCH_FAILED", "Failed to fetch shield events", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
