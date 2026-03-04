import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchApprovalQueue } from "@/server/services/control-plane/approval-service";

export async function GET() {
  const user = await requireOrganizationRole("ADMIN");
  const items = await fetchApprovalQueue(user.organizationId!);

  return NextResponse.json({ items });
}
