import { NextResponse } from "next/server";
import { z } from "zod";

import { validateJson } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { processAgentActionThroughGateway } from "@/server/services/security/agent-gateway-service";

const bodySchema = z.object({
  agentId: z.string().trim().min(1),
  action: z.string().trim().min(1),
  target: z.string().trim().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const body = await validateJson(request, bodySchema);
  if (!body.success) {
    return NextResponse.json({ error: body.error, issues: body.issues }, { status: 400 });
  }

  const result = await processAgentActionThroughGateway({
    organizationId: user.organizationId!,
    agentId: body.data.agentId,
    action: body.data.action,
    target: body.data.target,
    payload: body.data.payload as Record<string, unknown> | undefined,
  });

  return NextResponse.json(result);
}
