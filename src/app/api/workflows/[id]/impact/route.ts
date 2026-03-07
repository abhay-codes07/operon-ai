import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { createWorkflowBusinessImpact, suggestDollarValuePerRun } from "@/lib/businessImpact/impact.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

const impactSchema = z.object({
  category: z.enum(["REVENUE_PROTECTION", "COST_SAVINGS", "COMPLIANCE", "GROWTH"]),
  estimatedDollarValuePerRun: z.number().positive().optional(),
  teamOwner: z.string().trim().min(2),
  businessObjective: z.string().trim().min(5),
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
    where: { id: parsedParams.data.id, organizationId: user.organizationId! },
    select: {
      id: true,
      definition: true,
      scheduleCron: true,
    },
  });
  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const payload = await request.json().catch(() => null);
  const parsedBody = impactSchema.safeParse(payload);
  if (!parsedBody.success) {
    return structuredApiError(400, "INVALID_IMPACT_PAYLOAD", "Invalid business impact payload", {
      issues: parsedBody.error.flatten(),
    });
  }

  const estimated =
    parsedBody.data.estimatedDollarValuePerRun ??
    (await suggestDollarValuePerRun({
      definition: workflow.definition as { steps?: Array<{ action?: string }> } | null,
      scheduleCron: workflow.scheduleCron,
    }));

  const impact = await createWorkflowBusinessImpact({
    workflowId: workflow.id,
    category: parsedBody.data.category,
    estimatedDollarValuePerRun: estimated,
    teamOwner: parsedBody.data.teamOwner,
    businessObjective: parsedBody.data.businessObjective,
  });

  return NextResponse.json({ impact }, { status: 201 });
}
