import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAuditLogs } from "@/server/services/security/audit-log-service";

const querySchema = z.object({
  agentId: z.string().trim().min(1).optional(),
  result: z.enum(["APPROVED", "BLOCKED", "FAILED"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const items = await fetchAuditLogs({
    organizationId: user.organizationId!,
    agentId: parsed.data.agentId,
    result: parsed.data.result,
    limit: parsed.data.limit ?? 100,
  });

  return NextResponse.json({ items });
}
