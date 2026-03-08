import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { pausePipeline } from "@/lib/pipeline/pipeline.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const params = paramsSchema.safeParse(context.params);
    if (!params.success) {
      return structuredApiError(400, "INVALID_PIPELINE_RUN_ID", "Pipeline run identifier is invalid");
    }

    const result = await pausePipeline(params.data.id, user.organizationId!);
    if (result.count === 0) {
      return structuredApiError(404, "PIPELINE_RUN_NOT_FOUND", "Pipeline run not found or not running");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return structuredApiError(500, "PIPELINE_PAUSE_FAILED", "Failed to pause pipeline run", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
