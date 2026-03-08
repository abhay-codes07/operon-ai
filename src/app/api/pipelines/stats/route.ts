import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getPipelineStats } from "@/lib/pipeline/metrics.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const stats = await getPipelineStats(user.organizationId!);
    return NextResponse.json({ stats });
  } catch (error) {
    return structuredApiError(500, "PIPELINE_STATS_FETCH_FAILED", "Failed to fetch pipeline stats", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
