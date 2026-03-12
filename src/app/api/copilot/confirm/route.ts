import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { streamCoPilotIntervention } from "@/lib/copilot/copilot-channel";
import { copilotConfirmSchema } from "@/lib/copilot/schemas";
import { logIntervention } from "@/lib/copilot/session.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const payload = await request.json().catch(() => null);
    const parsed = copilotConfirmSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_COPILOT_CONFIRM_PAYLOAD", "Invalid Co-Pilot confirmation payload", {
        issues: parsed.error.flatten(),
      });
    }

    const session = await prisma.coPilotSession.findFirst({
      where: {
        id: parsed.data.sessionId,
        organizationId: user.organizationId!,
      },
      select: { id: true },
    });
    if (!session) {
      return structuredApiError(404, "COPILOT_SESSION_NOT_FOUND", "Co-Pilot session not found");
    }

    const intervention = await logIntervention({
      organizationId: user.organizationId!,
      sessionId: parsed.data.sessionId,
      stepId: parsed.data.stepId,
      agentConfidence: parsed.data.confidence,
      agentSuggestedAction: parsed.data.action,
      humanAction: parsed.data.action,
      interventionType: "CONFIRM",
    });

    await streamCoPilotIntervention({
      organizationId: user.organizationId!,
      executionId: parsed.data.runId,
      sessionId: parsed.data.sessionId,
      stepId: parsed.data.stepId,
      humanAction: parsed.data.action,
    }).catch(() => null);

    return NextResponse.json({ intervention }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "COPILOT_CONFIRM_FAILED", "Failed to confirm Co-Pilot action", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
