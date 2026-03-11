import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { recordAutopilotAction } from "@/lib/autopilot/autopilot.service";
import { autopilotActionSchema } from "@/lib/autopilot/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const payload = await request.json().catch(() => null);
    const parsed = autopilotActionSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_ACTION_PAYLOAD", "Invalid autopilot action payload", {
        issues: parsed.error.flatten(),
      });
    }

    const action = await recordAutopilotAction({
      orgId: user.organizationId!,
      sessionId: parsed.data.sessionId,
      actionType: parsed.data.actionType,
      selector: parsed.data.selector,
      value: parsed.data.value,
      metadata: parsed.data.metadata,
    });

    if (!action) {
      return structuredApiError(404, "AUTOPILOT_SESSION_NOT_FOUND", "Autopilot session not found");
    }

    return NextResponse.json({ action }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_ACTION_RECORD_FAILED", "Failed to record autopilot action", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
