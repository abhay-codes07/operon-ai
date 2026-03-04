import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchReliabilityDashboard } from "@/server/services/agents/reliability-service";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");

  const items = await fetchReliabilityDashboard(user.organizationId!);
  return NextResponse.json({ items });
}
