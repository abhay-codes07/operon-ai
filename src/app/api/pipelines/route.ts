import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { createPipelineSchema } from "@/lib/pipeline/pipeline.schemas";
import { createPipeline, listPipelines } from "@/lib/pipeline/pipeline.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await listPipelines(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "PIPELINES_FETCH_FAILED", "Failed to fetch pipelines", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const payload = await request.json().catch(() => null);
    const parsed = createPipelineSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_PIPELINE_PAYLOAD", "Invalid pipeline payload", {
        issues: parsed.error.flatten(),
      });
    }

    const pipeline = await createPipeline(user.organizationId!, parsed.data);
    return NextResponse.json({ pipeline }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "PIPELINE_CREATE_FAILED", "Failed to create pipeline", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
