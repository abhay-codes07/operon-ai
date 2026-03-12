import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getCoPilotSummary } from "@/lib/copilot/summary.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const summary = await getCoPilotSummary(user.organizationId!);
    return NextResponse.json({ summary });
  } catch (error) {
    return structuredApiError(500, "COPILOT_SUMMARY_FETCH_FAILED", "Failed to fetch Co-Pilot summary", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
