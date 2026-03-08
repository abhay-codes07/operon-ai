import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getWorkflowFinopsSnapshot } from "@/lib/finops/workflow-finops.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const params = paramsSchema.safeParse(context.params);
    if (!params.success) {
      return structuredApiError(400, "INVALID_WORKFLOW_ID", "Workflow identifier is invalid");
    }

    const snapshot = await getWorkflowFinopsSnapshot(params.data.id);
    if (!snapshot || snapshot.workflow.organizationId !== user.organizationId) {
      return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    return structuredApiError(500, "FINOPS_WORKFLOW_FETCH_FAILED", "Failed to fetch workflow finops snapshot", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
