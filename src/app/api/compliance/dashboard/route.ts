import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getComplianceDashboardSummary } from "@/lib/compliance/dashboard.service";
import { listComplianceViolations } from "@/lib/compliance/violation.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const [summary, violations] = await Promise.all([
      getComplianceDashboardSummary(user.organizationId!),
      listComplianceViolations(user.organizationId!),
    ]);

    return NextResponse.json({
      summary,
      recentViolations: violations.slice(0, 10),
    });
  } catch (error) {
    return structuredApiError(500, "COMPLIANCE_DASHBOARD_FETCH_FAILED", "Failed to load compliance dashboard data", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
