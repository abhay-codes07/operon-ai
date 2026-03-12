import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listTrainingData } from "@/lib/copilot/session.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(2000).default(500),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_COPILOT_TRAINING_QUERY", "Invalid Co-Pilot training data query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listTrainingData(user.organizationId!, parsed.data.limit);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "COPILOT_TRAINING_DATA_FETCH_FAILED", "Failed to fetch Co-Pilot training data", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
