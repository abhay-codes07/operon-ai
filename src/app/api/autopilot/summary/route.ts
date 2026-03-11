import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getAutopilotSummary } from "@/lib/autopilot/dashboard.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const summary = await getAutopilotSummary(user.organizationId!);
    return NextResponse.json({ summary });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_SUMMARY_FETCH_FAILED", "Failed to fetch autopilot summary", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
