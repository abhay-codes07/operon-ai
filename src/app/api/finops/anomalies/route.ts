import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listCostAnomalies } from "@/lib/finops/anomaly.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await listCostAnomalies(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "FINOPS_ANOMALIES_FETCH_FAILED", "Failed to fetch cost anomalies", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
