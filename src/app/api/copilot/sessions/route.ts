import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listCoPilotSessions } from "@/lib/copilot/session.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_COPILOT_SESSIONS_QUERY", "Invalid Co-Pilot sessions query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listCoPilotSessions(user.organizationId!, parsed.data.limit);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "COPILOT_SESSIONS_FETCH_FAILED", "Failed to fetch Co-Pilot sessions", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
