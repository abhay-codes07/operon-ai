import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
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

    const run = await prisma.pipelineRun.findFirst({
      where: {
        id: params.data.id,
        orgId: user.organizationId!,
      },
      include: {
        stepRuns: {
          include: {
            step: true,
            agentRun: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!run) {
      return structuredApiError(404, "PIPELINE_RUN_NOT_FOUND", "Pipeline run not found");
    }

    return NextResponse.json({ run });
  } catch (error) {
    return structuredApiError(500, "PIPELINE_RUN_FETCH_FAILED", "Failed to fetch pipeline run", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
