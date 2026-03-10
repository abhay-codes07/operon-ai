import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getWorkflowShieldStatus } from "@/lib/shield/workflow-status.service";
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

    const status = await getWorkflowShieldStatus({
      workflowId: workflow.id,
    });

    return NextResponse.json({ status });
  } catch (error) {
    return structuredApiError(500, "SHIELD_WORKFLOW_STATUS_FETCH_FAILED", "Failed to fetch workflow shield status", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
