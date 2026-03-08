import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getPipelineCostBreakdown } from "@/lib/finops/pipeline-cost.service";
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
  try {
    const user = await requireOrganizationRole("MEMBER");
    const params = paramsSchema.safeParse(context.params);
    if (!params.success) {
      return structuredApiError(400, "INVALID_PIPELINE_RUN_ID", "Pipeline run identifier is invalid");
    }

    const pipelineRun = await prisma.pipelineRun.findFirst({
      where: {
        id: params.data.id,
        orgId: user.organizationId!,
      },
      select: { id: true },
    });
    if (!pipelineRun) {
      return structuredApiError(404, "PIPELINE_RUN_NOT_FOUND", "Pipeline run not found");
    }

    const breakdown = await getPipelineCostBreakdown(pipelineRun.id);
    return NextResponse.json({ breakdown });
  } catch (error) {
    return structuredApiError(500, "FINOPS_PIPELINE_COST_FETCH_FAILED", "Failed to fetch pipeline cost breakdown", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
