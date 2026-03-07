import { z } from "zod";
import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { generatePlainEnglishSummary, getCompliancePassport } from "@/lib/compliance/passport.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

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
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return structuredApiError(400, "INVALID_WORKFLOW_ID", "Workflow identifier is invalid");
  }

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: parsedParams.data.workflowId,
      organizationId: user.organizationId!,
    },
    select: { id: true },
  });
  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const passport = (await getCompliancePassport(workflow.id)) ?? (await generatePlainEnglishSummary(workflow.id))?.passport;
  if (!passport) {
    return structuredApiError(404, "PASSPORT_NOT_FOUND", "Compliance passport not found for workflow");
  }

  return NextResponse.json({ passport });
}
