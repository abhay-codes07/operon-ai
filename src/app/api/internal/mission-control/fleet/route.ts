import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchMissionFleetDashboard } from "@/server/services/mission-control/fleet-service";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const payload = await fetchMissionFleetDashboard(user.organizationId!);

  return NextResponse.json(payload);
}
