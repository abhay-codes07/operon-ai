import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { getExecutionQueueHealth } from "@/server/queue/monitoring/health";

export async function GET() {
  await requireOrganizationRole("ADMIN");

  const snapshot = await getExecutionQueueHealth();
  return NextResponse.json(snapshot);
}
