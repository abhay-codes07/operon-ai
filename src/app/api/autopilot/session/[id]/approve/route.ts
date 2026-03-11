import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { patchAutopilotSession } from "@/lib/autopilot/autopilot.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const updated = await patchAutopilotSession({
      orgId: user.organizationId!,
      sessionId: context.params.id,
      status: "APPROVED",
    });
    if (!updated) {
      return structuredApiError(404, "AUTOPILOT_SESSION_NOT_FOUND", "Autopilot session not found");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_SESSION_APPROVE_FAILED", "Failed to approve autopilot session", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
