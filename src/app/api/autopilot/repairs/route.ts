import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listAutopilotRepairEventsPage } from "@/lib/autopilot/dashboard.service";
import { autopilotListRepairEventsQuerySchema } from "@/lib/autopilot/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const parsed = autopilotListRepairEventsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_AUTOPILOT_REPAIR_QUERY", "Invalid autopilot repair events query", {
        issues: parsed.error.flatten(),
      });
    }

    const result = await listAutopilotRepairEventsPage({
      orgId: user.organizationId!,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      workflowId: parsed.data.workflowId,
      runId: parsed.data.runId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return structuredApiError(500, "AUTOPILOT_REPAIRS_FETCH_FAILED", "Failed to fetch autopilot repair events", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
