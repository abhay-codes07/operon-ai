import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listDomainMemories } from "@/lib/autopilot/dashboard.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_MEMORY_QUERY", "Invalid autopilot memory query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listDomainMemories(user.organizationId!, parsed.data.limit);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_MEMORIES_FETCH_FAILED", "Failed to fetch autopilot memories", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
