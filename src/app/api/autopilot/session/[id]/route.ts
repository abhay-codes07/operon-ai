import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getAutopilotSession, patchAutopilotSession } from "@/lib/autopilot/autopilot.service";
import { autopilotSessionPatchSchema } from "@/lib/autopilot/schemas";
import { canTransitionSessionStatus } from "@/lib/autopilot/session-state.service";
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const payload = await request.json().catch(() => null);
    const parsed = autopilotSessionPatchSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_SESSION_PATCH", "Invalid autopilot session patch payload", {
        issues: parsed.error.flatten(),
      });
    }

    const existing = await getAutopilotSession(user.organizationId!, context.params.id);
    if (!existing) {
      return structuredApiError(404, "AUTOPILOT_SESSION_NOT_FOUND", "Autopilot session not found");
    }
    if (parsed.data.status && !canTransitionSessionStatus(existing.status, parsed.data.status)) {
      return structuredApiError(409, "AUTOPILOT_INVALID_STATUS_TRANSITION", "Invalid autopilot session status transition", {
        from: existing.status,
        to: parsed.data.status,
      });
    }

    const updated = await patchAutopilotSession({
      orgId: user.organizationId!,
      sessionId: context.params.id,
      status: parsed.data.status,
      compiledDefinition: parsed.data.compiledDefinition,
      parameterSchema: parsed.data.parameterSchema,
    });
    if (!updated) {
      return structuredApiError(404, "AUTOPILOT_SESSION_NOT_FOUND", "Autopilot session not found");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_SESSION_PATCH_FAILED", "Failed to patch autopilot session", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
