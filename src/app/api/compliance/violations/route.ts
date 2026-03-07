import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listComplianceViolations } from "@/lib/compliance/violation.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await listComplianceViolations(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "COMPLIANCE_VIOLATIONS_FETCH_FAILED", "Failed to fetch compliance violations", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
