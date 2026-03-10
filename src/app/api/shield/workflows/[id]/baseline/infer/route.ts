import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import {
  inferBehaviorBaselineFromWorkflowDefinition,
  upsertBehaviorBaseline,
} from "@/lib/shield/policy.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: context.params.id,
        organizationId: user.organizationId!,
      },
      select: {
        id: true,
        definition: true,
      },
    });

    if (!workflow) {
      return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
    }

    const inferred = inferBehaviorBaselineFromWorkflowDefinition(workflow.definition);
    const item = await upsertBehaviorBaseline({
      workflowId: workflow.id,
      allowedActions: inferred.allowedActions,
      allowedDomains: inferred.allowedDomains,
    });

    return NextResponse.json({
      item,
      inferred,
    });
  } catch (error) {
    return structuredApiError(500, "SHIELD_BASELINE_INFER_FAILED", "Failed to infer shield baseline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
