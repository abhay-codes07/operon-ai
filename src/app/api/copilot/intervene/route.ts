import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { streamCoPilotIntervention } from "@/lib/copilot/copilot-channel";
import { copilotInterveneSchema } from "@/lib/copilot/schemas";
import { logIntervention } from "@/lib/copilot/session.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const payload = await request.json().catch(() => null);
    const parsed = copilotInterveneSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_COPILOT_INTERVENTION_PAYLOAD", "Invalid Co-Pilot intervention payload", {
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
      agentConfidence: parsed.data.agentConfidence,
      agentSuggestedAction: parsed.data.agentSuggestedAction,
      humanAction: parsed.data.humanAction,
      interventionType: parsed.data.interventionType,
      metadata: parsed.data.metadata,
    });

    await streamCoPilotIntervention({
      organizationId: user.organizationId!,
      executionId: parsed.data.runId,
      sessionId: parsed.data.sessionId,
      stepId: parsed.data.stepId,
      humanAction: parsed.data.humanAction,
    }).catch(() => null);

    await prisma.executionLog.create({
      data: {
        executionId: parsed.data.runId,
        organizationId: user.organizationId!,
        level: "INFO",
        message: "Co-Pilot intervention applied",
        metadata: {
          stepId: parsed.data.stepId,
          sessionId: parsed.data.sessionId,
          interventionId: intervention.id,
          humanAction: parsed.data.humanAction,
        },
      },
    }).catch(() => null);

    return NextResponse.json({ intervention }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "COPILOT_INTERVENTION_FAILED", "Failed to apply Co-Pilot intervention", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
