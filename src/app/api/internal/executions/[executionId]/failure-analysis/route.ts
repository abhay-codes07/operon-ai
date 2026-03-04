import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  analyzeExecutionFailure,
  fetchFailureAnalysis,
} from "@/server/services/executions/failure-analysis-service";

const paramsSchema = z.object({
  executionId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid execution identifier" }, { status: 400 });
  }

  let analysis = await fetchFailureAnalysis({
    organizationId: user.organizationId!,
    executionId: parsed.data.executionId,
  });

  if (!analysis) {
    analysis = await analyzeExecutionFailure({
      organizationId: user.organizationId!,
      executionId: parsed.data.executionId,
    });
  }

  return NextResponse.json({ analysis });
}
