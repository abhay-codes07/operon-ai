import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  fetchAutonomyStatus,
  generateAdaptiveWorkflowProposal,
} from "@/server/services/workflows/autonomy-engine";

const paramsSchema = z.object({
  workflowId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    workflowId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid workflow identifier" }, { status: 400 });
  }

  const status = await fetchAutonomyStatus({
    organizationId: user.organizationId!,
    workflowId: parsed.data.workflowId,
  });

  return NextResponse.json(status);
}

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid workflow identifier" }, { status: 400 });
  }

  const proposal = await generateAdaptiveWorkflowProposal({
    organizationId: user.organizationId!,
    workflowId: parsed.data.workflowId,
  });

  return NextResponse.json(proposal, { status: 201 });
}
