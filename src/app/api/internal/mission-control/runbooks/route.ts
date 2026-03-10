import { NextResponse } from "next/server";
import { z } from "zod";

import { validateJson } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { createRecoveryRunbook, fetchRunbookExecutionHistory } from "@/server/services/mission-control/runbook-engine";

const createRunbookBodySchema = z.object({
  name: z.string().trim().min(3),
  description: z.string().trim().min(5),
  triggerType: z.enum(["FAILURE_SPIKE", "SELECTOR_ERROR_LOOP", "RETRY_LOOP"]),
  steps: z
    .array(
      z.object({
        action: z.enum(["retry_login", "refresh_session", "fallback_selector", "notify_user"]),
        config: z.record(z.string(), z.any()).optional(),
      }),
    )
    .min(1),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const executions = await fetchRunbookExecutionHistory(user.organizationId!);

  return NextResponse.json({ executions });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const body = await validateJson(request, createRunbookBodySchema);

  if (!body.success) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const runbook = await createRecoveryRunbook({
    organizationId: user.organizationId!,
    name: body.data.name,
    description: body.data.description,
    triggerType: body.data.triggerType,
    steps: body.data.steps,
  });

  return NextResponse.json({ runbook }, { status: 201 });
}
