import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { retryPipelineStepRun } from "@/lib/pipeline/execution.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
  stepRunId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    id: string;
    stepRunId: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const params = paramsSchema.safeParse(context.params);
    if (!params.success) {
      return structuredApiError(400, "INVALID_PARAMS", "Pipeline run retry params are invalid");
    }

    const retried = await retryPipelineStepRun({
      orgId: user.organizationId!,
      pipelineRunId: params.data.id,
      stepRunId: params.data.stepRunId,
    });
    if (!retried) {
      return structuredApiError(404, "PIPELINE_STEP_RUN_NOT_FOUND", "Pipeline step run not found");
    }

    return NextResponse.json({ stepRun: retried });
  } catch (error) {
    return structuredApiError(500, "PIPELINE_STEP_RETRY_FAILED", "Failed to retry pipeline step", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
