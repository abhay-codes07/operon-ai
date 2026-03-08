import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getPipelineById } from "@/lib/pipeline/pipeline.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

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
      return structuredApiError(400, "INVALID_PIPELINE_ID", "Pipeline identifier is invalid");
    }

    const pipeline = await getPipelineById(user.organizationId!, params.data.id);
    if (!pipeline) {
      return structuredApiError(404, "PIPELINE_NOT_FOUND", "Pipeline not found");
    }

    return NextResponse.json({ pipeline });
  } catch (error) {
    return structuredApiError(500, "PIPELINE_FETCH_FAILED", "Failed to fetch pipeline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
