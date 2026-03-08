import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { runCompetitiveIntelligencePipeline } from "@/lib/intelligence/intelligence-pipeline.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function POST() {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const result = await runCompetitiveIntelligencePipeline(user.organizationId!);
    return NextResponse.json({ result }, { status: 202 });
  } catch (error) {
    return structuredApiError(500, "INTELLIGENCE_PIPELINE_RUN_FAILED", "Failed to run intelligence pipeline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
