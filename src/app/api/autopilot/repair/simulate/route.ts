import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { selectorRepairRequestSchema } from "@/lib/autopilot/schemas";
import { findAlternativeSelector, validateRepair } from "@/lib/autopilot/selector-repair.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function POST(request: Request) {
  try {
    await requireOrganizationRole("MEMBER");
    const payload = await request.json().catch(() => null);
    const parsed = selectorRepairRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_REPAIR_SIM_PAYLOAD", "Invalid repair simulation payload", {
        issues: parsed.error.flatten(),
      });
    }

    const result = findAlternativeSelector({
      failedSelector: parsed.data.failedSelector,
      candidates: parsed.data.candidateSelectors,
    });
    const valid = validateRepair(result, parsed.data.candidateSelectors);

    return NextResponse.json({ result, valid });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_REPAIR_SIM_FAILED", "Failed to simulate selector repair", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
