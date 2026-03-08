import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { createPipelineSchema } from "@/lib/pipeline/pipeline.schemas";
import { createPipeline, listPipelines } from "@/lib/pipeline/pipeline.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  query: z.string().trim().min(1).optional(),
  status: z.enum(["RUNNING", "PAUSED", "FAILED", "COMPLETED"]).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = querySchema.safeParse({
      query: new URL(request.url).searchParams.get("query") ?? undefined,
      status: new URL(request.url).searchParams.get("status") ?? undefined,
    });
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_QUERY", "Invalid pipelines query params", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listPipelines({
      orgId: user.organizationId!,
      query: parsed.data.query,
      runStatus: parsed.data.status,
    });
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
