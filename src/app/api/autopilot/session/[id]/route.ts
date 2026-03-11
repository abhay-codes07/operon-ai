import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getAutopilotSession } from "@/lib/autopilot/autopilot.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const session = await getAutopilotSession(user.organizationId!, context.params.id);
    if (!session) {
      return structuredApiError(404, "AUTOPILOT_SESSION_NOT_FOUND", "Autopilot session not found");
    }

    return NextResponse.json({ session });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_SESSION_FETCH_FAILED", "Failed to fetch autopilot session", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
