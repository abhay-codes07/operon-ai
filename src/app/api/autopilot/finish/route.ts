import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { finishAutopilotSession } from "@/lib/autopilot/autopilot.service";
import { autopilotFinishSchema } from "@/lib/autopilot/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const payload = await request.json().catch(() => null);
    const parsed = autopilotFinishSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_FINISH_PAYLOAD", "Invalid autopilot finish payload", {
        issues: parsed.error.flatten(),
      });
    }

    const result = await finishAutopilotSession({
      orgId: user.organizationId!,
      sessionId: parsed.data.sessionId,
      approve: parsed.data.approve,
      name: parsed.data.name,
      description: parsed.data.description,
      editedDefinition: parsed.data.editedDefinition as unknown as Record<string, unknown> | undefined,
    });

    if (!result.ok) {
      const code = result.reason === "session_not_found" ? "AUTOPILOT_SESSION_NOT_FOUND" : "AUTOPILOT_FINISH_FAILED";
      const status = result.reason === "session_not_found" ? 404 : 400;
      return structuredApiError(status, code, "Autopilot session could not be finalized", {
        reason: result.reason,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_FINISH_FAILED", "Failed to finalize autopilot session", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
