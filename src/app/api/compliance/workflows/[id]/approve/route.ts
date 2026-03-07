import { z } from "zod";
import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { approveWorkflow } from "@/lib/compliance/approval.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

const payloadSchema = z.object({
  notes: z.string().trim().max(1_000).optional(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
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

  const payload = await request.json().catch(() => null);
  const parsedPayload = payloadSchema.safeParse(payload ?? {});
  if (!parsedPayload.success) {
    return structuredApiError(400, "INVALID_APPROVAL_PAYLOAD", "Invalid approval payload", {
      issues: parsedPayload.error.flatten(),
    });
  }

  const approval = await approveWorkflow(workflow.id, user.id, parsedPayload.data.notes);
  if (!approval) {
    return structuredApiError(500, "APPROVAL_CREATE_FAILED", "Could not create workflow approval");
  }

  return NextResponse.json({ approval }, { status: 201 });
}
