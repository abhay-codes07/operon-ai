import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listComplianceViolations } from "@/lib/compliance/violation.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  workflowId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const searchParams = new URL(request.url).searchParams;
    const parsed = querySchema.safeParse({
      workflowId: searchParams.get("workflowId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_QUERY", "Invalid compliance violations query", {
        issues: parsed.error.flatten(),
      });
    }

    const items = await listComplianceViolations(user.organizationId!);
    const filtered = parsed.data.workflowId
      ? items.filter((item: { workflowId: string }) => item.workflowId === parsed.data.workflowId)
      : items;
    const sliced = typeof parsed.data.limit === "number" ? filtered.slice(0, parsed.data.limit) : filtered;

    return NextResponse.json({ items: sliced });
  } catch (error) {
    return structuredApiError(500, "COMPLIANCE_VIOLATIONS_FETCH_FAILED", "Failed to fetch compliance violations", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
