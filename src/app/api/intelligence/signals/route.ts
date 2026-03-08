import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listSignals } from "@/lib/intelligence/signal.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = querySchema.safeParse({
      limit: new URL(request.url).searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_QUERY", "Invalid intelligence signals query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listSignals(user.organizationId!, parsed.data.limit ?? 200);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "INTELLIGENCE_SIGNALS_FETCH_FAILED", "Failed to fetch intelligence signals", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
