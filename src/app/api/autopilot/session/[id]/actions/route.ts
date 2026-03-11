import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listAutopilotSessionActions } from "@/lib/autopilot/dashboard.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(200).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_ACTION_QUERY", "Invalid autopilot actions query", {
        issues: parsed.error.flatten(),
      });
    }

    const result = await listAutopilotSessionActions({
      orgId: user.organizationId!,
      sessionId: context.params.id,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });
    return NextResponse.json(result);
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_ACTIONS_FETCH_FAILED", "Failed to fetch autopilot session actions", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
