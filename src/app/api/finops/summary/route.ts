import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getFinOpsDashboardSummary } from "@/lib/finops/dashboard.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const summary = await getFinOpsDashboardSummary(user.organizationId!);
    return NextResponse.json({ summary });
  } catch (error) {
    return structuredApiError(500, "FINOPS_SUMMARY_FETCH_FAILED", "Failed to fetch FinOps summary", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
