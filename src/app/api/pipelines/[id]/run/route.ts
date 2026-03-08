import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { startPipelineSchema } from "@/lib/pipeline/pipeline.schemas";
import { startPipeline } from "@/lib/pipeline/pipeline.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const params = paramsSchema.safeParse(context.params);
    if (!params.success) {
      return structuredApiError(400, "INVALID_PIPELINE_ID", "Pipeline identifier is invalid");
    }

    const payload = await request.json().catch(() => ({}));
    const parsed = startPipelineSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_PIPELINE_RUN_PAYLOAD", "Invalid pipeline run payload", {
        issues: parsed.error.flatten(),
      });
    }

    const run = await startPipeline(params.data.id, parsed.data.input, user.organizationId!);
    if (!run) {
      return structuredApiError(404, "PIPELINE_NOT_FOUND", "Pipeline not found");
    }

    return NextResponse.json({ run }, { status: 202 });
  } catch (error) {
    return structuredApiError(500, "PIPELINE_START_FAILED", "Failed to start pipeline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
