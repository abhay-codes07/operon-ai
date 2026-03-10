import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listIncidentsByOrganization } from "@/lib/sla/incident.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const querySchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
  workflowId: z.string().trim().optional(),
});

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) {
    return structuredApiError(400, "INVALID_QUERY", "Invalid incidents query", {
      issues: parsed.error.flatten(),
    });
  }

  const incidents = await listIncidentsByOrganization(user.organizationId!);
  const filtered = incidents.filter((item: { workflowId: string | null; resolvedAt: Date | null }) => {
    if (parsed.data.workflowId && item.workflowId !== parsed.data.workflowId) {
      return false;
    }
    if (parsed.data.status === "OPEN" && item.resolvedAt) {
      return false;
    }
    if (parsed.data.status === "RESOLVED" && !item.resolvedAt) {
      return false;
    }
    return true;
  });

  return NextResponse.json({ items: filtered });
}
