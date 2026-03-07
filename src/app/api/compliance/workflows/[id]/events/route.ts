import { z } from "zod";
import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
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
    select: { id: true },
  });
  if (!workflow) {
    return structuredApiError(404, "WORKFLOW_NOT_FOUND", "Workflow not found");
  }

  const search = new URL(request.url).searchParams;
  const parsedQuery = querySchema.safeParse({
    limit: search.get("limit") ?? undefined,
  });
  if (!parsedQuery.success) {
    return structuredApiError(400, "INVALID_QUERY", "Invalid events query", {
      issues: parsedQuery.error.flatten(),
    });
  }

  const events = await prisma.complianceEvent.findMany({
    where: {
      organizationId: user.organizationId!,
      workflowId: workflow.id,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: parsedQuery.data.limit ?? 200,
  });

  return NextResponse.json({ events });
}
