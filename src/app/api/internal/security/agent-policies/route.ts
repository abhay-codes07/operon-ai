import { NextResponse } from "next/server";
import { z } from "zod";

import { validateJson } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentPolicies, saveAgentPolicy } from "@/server/services/security/agent-policy-service";

const upsertPolicyBodySchema = z.object({
  agentId: z.string().trim().min(1),
  enabled: z.boolean().default(true),
  maxRunsPerHour: z.number().int().min(1).max(2000).default(120),
  allowedWindowStartHr: z.number().int().min(0).max(23).optional(),
  allowedWindowEndHr: z.number().int().min(0).max(23).optional(),
  timezone: z.string().trim().min(2).max(80).default("UTC"),
  domainAllowlist: z.array(z.string().trim().min(1)).default([]),
  actionAllowlist: z.array(z.string().trim().min(1)).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET() {
  const user = await requireOrganizationRole("ADMIN");
  const policies = await fetchAgentPolicies(user.organizationId!);

  return NextResponse.json({ policies });
}

export async function PUT(request: Request) {
  const user = await requireOrganizationRole("OWNER");
  const body = await validateJson(request, upsertPolicyBodySchema);
  if (!body.success) {
    return NextResponse.json({ error: body.error, issues: body.issues }, { status: 400 });
  }

  const policy = await saveAgentPolicy({
    organizationId: user.organizationId!,
    agentId: body.data.agentId,
    policy: {
      enabled: body.data.enabled,
      maxRunsPerHour: body.data.maxRunsPerHour,
      allowedWindowStartHr: body.data.allowedWindowStartHr,
      allowedWindowEndHr: body.data.allowedWindowEndHr,
      timezone: body.data.timezone,
      domainAllowlist: body.data.domainAllowlist,
      actionAllowlist: body.data.actionAllowlist,
      metadata: body.data.metadata,
    },
  });

  return NextResponse.json({ policy });
}
