import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchChangeRadarFeed } from "@/server/services/monitoring/change-radar-service";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const events = await fetchChangeRadarFeed(user.organizationId!);

  return NextResponse.json({ items: events });
}
