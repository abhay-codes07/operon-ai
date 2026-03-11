import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { createAutopilotSession } from "@/lib/autopilot/autopilot.service";
import { autopilotStartSchema } from "@/lib/autopilot/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const payload = await request.json().catch(() => null);
    const parsed = autopilotStartSchema.safeParse(payload);

    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_START_PAYLOAD", "Invalid autopilot start payload", {
        issues: parsed.error.flatten(),
      });
    }

    const session = await createAutopilotSession({
      orgId: user.organizationId!,
      userId: user.id!,
      domain: parsed.data.domain,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_START_FAILED", "Failed to start autopilot session", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
