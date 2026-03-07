import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { createWorkflowSLA } from "@/lib/sla/sla.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";
import { isCronExpressionValid } from "@/lib/utils/cron";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

const slaSchema = z.object({
  expectedSchedule: z.string().trim().min(5),
  maxFailureRate: z.number().min(0).max(1),
  maxExecutionTimeSeconds: z.number().int().min(1),
  rollingWindowDays: z.number().int().min(1).max(90),
  notificationSlackChannel: z.string().trim().optional(),
  notificationEmail: z.string().trim().email().optional(),
  escalationAfterBreaches: z.number().int().min(1).max(100).optional(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

async function ensureWorkflowInOrg(organizationId: string, workflowId: string) {
  return prisma.workflow.findFirst({
    where: { id: workflowId, organizationId },
    select: { id: true },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return structuredApiError(400, "INVALID_WORKFLOW_ID", "Workflow identifier is invalid");
  }

  const workflow = await ensureWorkflowInOrg(user.organizationId!, parsed.data.id);
  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const sla = await prisma.workflowSLA.findUnique({
    where: { workflowId: parsed.data.id },
  });
  return NextResponse.json({ sla });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return structuredApiError(400, "INVALID_WORKFLOW_ID", "Workflow identifier is invalid");
  }

  const workflow = await ensureWorkflowInOrg(user.organizationId!, parsedParams.data.id);
  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const payload = await request.json().catch(() => null);
  const parsedBody = slaSchema.safeParse(payload);
  if (!parsedBody.success) {
    return structuredApiError(400, "INVALID_SLA_PAYLOAD", "Invalid SLA payload", {
      issues: parsedBody.error.flatten(),
    });
  }
  if (!isCronExpressionValid(parsedBody.data.expectedSchedule)) {
    return structuredApiError(400, "INVALID_CRON", "SLA expectedSchedule must be a valid cron string");
  }

  const sla = await createWorkflowSLA(parsedParams.data.id, parsedBody.data);
  return NextResponse.json({ sla }, { status: 201 });
}

export async function PATCH(request: Request, context: RouteContext) {
  return POST(request, context);
}
