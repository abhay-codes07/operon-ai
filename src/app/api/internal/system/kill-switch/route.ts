import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  isAgentExecutionEnabled,
  setGlobalAgentExecutionEnabled,
} from "@/server/services/control-plane/system-flag-service";

const payloadSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().max(500).optional(),
});

export async function GET() {
  await requireOrganizationRole("ADMIN");
  const enabled = await isAgentExecutionEnabled();

  return NextResponse.json({
    key: "agentExecutionEnabled",
    enabled,
  });
}

export async function PUT(request: Request) {
  const user = await requireOrganizationRole("OWNER");
  const { data, error } = await parseJsonBody(request, payloadSchema);
  if (error) {
    return error;
  }

  const flag = await setGlobalAgentExecutionEnabled({
    enabled: data.enabled,
    metadata: {
      updatedBy: user.id,
      reason: data.reason ?? null,
      updatedAt: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    key: flag.key,
    enabled: flag.enabled,
  });
}
