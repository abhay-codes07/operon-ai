import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { generateInsights } from "@/lib/intelligence/insight.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await generateInsights(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "INTELLIGENCE_INSIGHTS_FETCH_FAILED", "Failed to fetch intelligence insights", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
