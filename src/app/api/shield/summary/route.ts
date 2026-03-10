import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getShieldSummary } from "@/lib/shield/summary.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const summary = await getShieldSummary(user.organizationId!);

    return NextResponse.json({
      summary: {
        totalEvents: summary.totalEvents,
        severity: summary.severity,
        hotWorkflows: summary.hotWorkflows,
      },
    });
  } catch (error) {
    return structuredApiError(500, "SHIELD_SUMMARY_FETCH_FAILED", "Failed to fetch shield summary", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
