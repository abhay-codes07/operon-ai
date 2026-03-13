import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { listIdentitiesForOrg } from "@/lib/sandbox/identity-vault.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await listIdentitiesForOrg(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "SANDBOX_IDENTITIES_FETCH_FAILED", "Failed to fetch sandbox identities", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
