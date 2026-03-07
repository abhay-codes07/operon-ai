import { z } from "zod";
import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { hasActiveWorkflowApproval, listWorkflowApprovals } from "@/lib/compliance/approval.service";
import { generatePlainEnglishSummary, getCompliancePassport } from "@/lib/compliance/passport.service";
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

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return structuredApiError(400, "INVALID_WORKFLOW_ID", "Workflow identifier is invalid");
  }

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: parsedParams.data.id,
      organizationId: user.organizationId!,
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const [approvalActive, approvals, passport, eventSummary, violationCount] = await Promise.all([
    hasActiveWorkflowApproval(workflow.id),
    listWorkflowApprovals(workflow.id),
    getCompliancePassport(workflow.id),
    generatePlainEnglishSummary(workflow.id),
    prisma.complianceViolation.count({
      where: {
        organizationId: user.organizationId!,
        workflowId: workflow.id,
      },
    }),
  ]);

  return NextResponse.json({
    workflow: {
      id: workflow.id,
      name: workflow.name,
      updatedAt: workflow.updatedAt,
    },
    approval: {
      isActive: approvalActive,
      history: approvals,
    },
    passport: passport
      ? {
          id: passport.id,
          riskLevel: passport.riskLevel,
          summaryText: passport.summaryText,
          reportUrl: passport.reportUrl,
          lastGeneratedAt: passport.lastGeneratedAt,
        }
      : null,
    summary: eventSummary
      ? {
          domainsVisited: eventSummary.domainsVisited,
          actionsPerformed: eventSummary.actionsPerformed,
          dataCategoriesAccessed: eventSummary.dataCategoriesAccessed,
        }
      : null,
    violations: {
      total: violationCount,
    },
  });
}
