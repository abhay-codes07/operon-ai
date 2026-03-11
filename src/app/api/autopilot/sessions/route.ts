import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listAutopilotSessions } from "@/lib/autopilot/dashboard.service";
import { autopilotListSessionsQuerySchema } from "@/lib/autopilot/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = autopilotListSessionsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_SESSION_QUERY", "Invalid autopilot session query", {
        issues: parsed.error.flatten(),
      });
    }

    const result = await listAutopilotSessions({
      orgId: user.organizationId!,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      status: parsed.data.status,
    });
    return NextResponse.json(result);
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_SESSIONS_FETCH_FAILED", "Failed to fetch autopilot sessions", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
