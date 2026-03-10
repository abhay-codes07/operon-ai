import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getShieldTimeline } from "@/lib/shield/timeline.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_QUERY", "Invalid shield timeline query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await getShieldTimeline({
      organizationId: user.organizationId!,
      days: parsed.data.days,
    });
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "SHIELD_TIMELINE_FETCH_FAILED", "Failed to fetch shield timeline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
