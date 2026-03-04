import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { reviewApprovalRequest } from "@/server/services/control-plane/approval-service";

const payloadSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(500).optional(),
  executionId: z.string().optional(),
});

type RouteContext = {
  params: {
    approvalRequestId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, payloadSchema);
  if (error) {
    return error;
  }

  const review = await reviewApprovalRequest({
    organizationId: user.organizationId!,
    approvalRequestId: context.params.approvalRequestId,
    reviewerId: user.id,
    approve: data.approve,
    note: data.note,
    executionId: data.executionId,
  });

  return NextResponse.json({ review });
}
