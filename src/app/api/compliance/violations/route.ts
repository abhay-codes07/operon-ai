import { NextResponse } from "next/server";

import { listComplianceViolations } from "@/lib/compliance/violation.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const items = await listComplianceViolations(user.organizationId!);
  return NextResponse.json({ items });
}
