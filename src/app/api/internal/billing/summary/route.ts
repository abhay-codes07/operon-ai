import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { getBillingSummary } from "@/server/services/billing/summary-service";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const summary = await getBillingSummary(user.organizationId!);
  return NextResponse.json(summary);
}
