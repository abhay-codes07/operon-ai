import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { setWorkflowBudget } from "@/lib/finops/budget.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const payloadSchema = z.object({
  workflowId: z.string().trim().min(1),
  monthlyBudgetUsd: z.number().positive(),
  alertThresholdPercent: z.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const payload = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_BUDGET_PAYLOAD", "Invalid budget payload", {
        issues: parsed.error.flatten(),
      });
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: parsed.data.workflowId,
        organizationId: user.organizationId!,
      },
      select: { id: true },
    });
    if (!workflow) {
      return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
    }

    const budget = await setWorkflowBudget({
      orgId: user.organizationId!,
      workflowId: parsed.data.workflowId,
      monthlyBudgetUsd: parsed.data.monthlyBudgetUsd,
      alertThresholdPercent: parsed.data.alertThresholdPercent,
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "FINOPS_BUDGET_SET_FAILED", "Failed to set workflow budget", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
