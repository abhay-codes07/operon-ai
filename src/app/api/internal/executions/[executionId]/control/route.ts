import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { enqueueExecutionControlCommand } from "@/server/services/control-plane/execution-control-service";

const paramsSchema = z.object({
  executionId: z.string().trim().min(1),
});

const commandSchema = z.object({
  action: z.enum(["PAUSE", "RESUME", "STEP", "OVERRIDE_ACTION", "STOP"]),
  reason: z.string().max(500).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid execution identifier" }, { status: 400 });
  }

  const { data, error } = await parseJsonBody(request, commandSchema);
  if (error) {
    return error;
  }

  const command = await enqueueExecutionControlCommand({
    organizationId: user.organizationId!,
    executionId: parsedParams.data.executionId,
    action: data.action,
    reason: data.reason,
    payload: data.payload,
  });

  return NextResponse.json({ command }, { status: 202 });
}
