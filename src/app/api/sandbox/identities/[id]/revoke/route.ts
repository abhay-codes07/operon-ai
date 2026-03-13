import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { revokeIdentity } from "@/lib/sandbox/identity-vault.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type RouteContext = {
  params: { id: string };
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireOrganizationRole("ADMIN");
    const identity = await revokeIdentity(context.params.id, "operator_revoke");
    return NextResponse.json({ identity });
  } catch (error) {
    return structuredApiError(500, "SANDBOX_IDENTITY_REVOKE_FAILED", "Failed to revoke sandbox identity", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
