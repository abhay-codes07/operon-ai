import { NextResponse } from "next/server";
import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listShieldEvents } from "@/lib/shield/event.service";
import { shieldEventsQuerySchema } from "@/lib/shield/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = shieldEventsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_QUERY", "Invalid shield events query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listShieldEvents({
      organizationId: user.organizationId!,
      limit: parsed.data.limit,
      workflowId: parsed.data.workflowId,
      runId: parsed.data.runId,
      severity: parsed.data.severity,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "SHIELD_EVENTS_FETCH_FAILED", "Failed to fetch shield events", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
