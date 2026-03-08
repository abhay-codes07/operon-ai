import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getOrganizationROI } from "@/lib/finops/roi.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await getOrganizationROI(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "FINOPS_ROI_FETCH_FAILED", "Failed to fetch ROI scores", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
