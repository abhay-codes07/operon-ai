import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { simulateSandboxAttack } from "@/lib/sandbox/sandbox-attack-simulator";
import { requireOrganizationRole } from "@/server/auth/authorization";

const payloadSchema = z.object({
  workflowId: z.string().trim().min(1),
  identityId: z.string().trim().min(1),
  attemptedDomain: z.string().trim().min(3),
});

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const payload = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_SANDBOX_ATTACK_SIM_PAYLOAD", "Invalid sandbox attack simulation payload", {
        issues: parsed.error.flatten(),
      });
    }

    const result = await simulateSandboxAttack({
      organizationId: user.organizationId!,
      workflowId: parsed.data.workflowId,
      identityId: parsed.data.identityId,
      attemptedDomain: parsed.data.attemptedDomain,
    });
    return NextResponse.json({ result });
  } catch (error) {
    return structuredApiError(500, "SANDBOX_ATTACK_SIM_FAILED", "Failed to run sandbox attack simulation", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
