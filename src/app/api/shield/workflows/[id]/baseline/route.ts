import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { shieldBaselinePayloadSchema } from "@/lib/shield/schemas";
import { getBehaviorBaseline, upsertBehaviorBaseline } from "@/lib/shield/policy.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: context.params.id,
        organizationId: user.organizationId!,
      },
      select: {
        id: true,
      },
    });

    if (!workflow) {
      return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
    }

    const item = await getBehaviorBaseline(workflow.id);
    return NextResponse.json({ item });
  } catch (error) {
    return structuredApiError(500, "SHIELD_BASELINE_FETCH_FAILED", "Failed to fetch shield baseline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: context.params.id,
        organizationId: user.organizationId!,
      },
      select: {
        id: true,
      },
    });

    if (!workflow) {
      return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
    }

    const payload = await request.json();
    const parsed = shieldBaselinePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_SHIELD_BASELINE_PAYLOAD", "Invalid shield baseline payload", {
        issues: parsed.error.flatten(),
      });
    }

    const item = await upsertBehaviorBaseline({
      workflowId: workflow.id,
      allowedActions: parsed.data.allowedActions,
      allowedDomains: parsed.data.allowedDomains,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return structuredApiError(500, "SHIELD_BASELINE_SAVE_FAILED", "Failed to save shield baseline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
