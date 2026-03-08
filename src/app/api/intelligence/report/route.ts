import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { generateMorningReport } from "@/lib/intelligence/report.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const report = await generateMorningReport(user.organizationId!);
    return NextResponse.json({ report });
  } catch (error) {
    return structuredApiError(500, "INTELLIGENCE_REPORT_FETCH_FAILED", "Failed to generate morning report", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
