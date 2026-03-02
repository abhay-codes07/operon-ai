import { NextResponse } from "next/server";

import { canConsumeExecution } from "@/server/services/billing/usage-service";

export async function enforceExecutionQuotaOrThrow(input: {
  organizationId: string;
}) {
  const allowance = await canConsumeExecution(input.organizationId);

  if (allowance.allowed) {
    return allowance;
  }

  throw NextResponse.json(
    {
      error: "Execution quota reached for current billing period",
      plan: allowance.plan,
      limit: allowance.limit,
      used: allowance.used,
      remaining: allowance.remaining,
    },
    { status: 402 },
  );
}
