import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listRunCoPilotInterventions } from "@/lib/copilot/replay.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await listRunCoPilotInterventions({
      organizationId: user.organizationId!,
      runId: context.params.executionId,
    });
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "COPILOT_REPLAY_FETCH_FAILED", "Failed to fetch Co-Pilot replay interventions", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
