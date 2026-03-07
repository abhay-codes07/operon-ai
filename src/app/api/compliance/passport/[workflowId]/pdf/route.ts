import { z } from "zod";
import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { generateCompliancePassportPdf } from "@/lib/compliance/pdf.service";
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
    select: {
      id: true,
      name: true,
    },
  });
  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const buffer = await generateCompliancePassportPdf(workflow.id);
  if (!buffer) {
    return structuredApiError(404, "PASSPORT_REPORT_NOT_FOUND", "Compliance passport report could not be generated");
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${workflow.name.replace(/\s+/g, "-").toLowerCase()}-compliance-passport.pdf\"`,
      "Cache-Control": "no-store",
    },
  });
}
