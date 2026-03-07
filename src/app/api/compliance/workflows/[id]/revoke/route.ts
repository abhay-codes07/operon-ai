import { z } from "zod";
import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { revokeApproval } from "@/lib/compliance/approval.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return structuredApiError(400, "INVALID_WORKFLOW_ID", "Workflow identifier is invalid");
  }

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: parsedParams.data.id,
      organizationId: user.organizationId!,
    },
    select: { id: true },
  });
  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const approval = await revokeApproval(workflow.id);
  if (!approval) {
    return structuredApiError(404, "ACTIVE_APPROVAL_NOT_FOUND", "No active approval found for workflow");
  }

  return NextResponse.json({ approval });
}
