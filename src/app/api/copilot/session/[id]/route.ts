import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getSessionWithInterventions } from "@/lib/copilot/session.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const session = await getSessionWithInterventions(context.params.id, user.organizationId!);
    if (!session) {
      return structuredApiError(404, "COPILOT_SESSION_NOT_FOUND", "Co-Pilot session not found");
    }
    return NextResponse.json({ session });
  } catch (error) {
    return structuredApiError(500, "COPILOT_SESSION_FETCH_FAILED", "Failed to fetch Co-Pilot session", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
