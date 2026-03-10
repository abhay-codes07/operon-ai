import { NextResponse } from "next/server";
import { structuredApiError } from "@/app/api/_lib/structured-error";
import { createShieldPolicy, listShieldPolicies } from "@/lib/shield/policy.service";
import { shieldPolicyPayloadSchema } from "@/lib/shield/schemas";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await listShieldPolicies(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "SHIELD_POLICIES_FETCH_FAILED", "Failed to fetch shield policies", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const payload = await request.json();
    const parsed = shieldPolicyPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_SHIELD_POLICY_PAYLOAD", "Invalid shield policy payload", {
        issues: parsed.error.flatten(),
      });
    }

    const item = await createShieldPolicy({
      organizationId: user.organizationId!,
      allowedDomains: parsed.data.allowedDomains,
      blockedActions: parsed.data.blockedActions,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "SHIELD_POLICY_CREATE_FAILED", "Failed to create shield policy", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
