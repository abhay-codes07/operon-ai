import { NextResponse } from "next/server";

import { listInstallationsByOrganization } from "@/lib/marketplace/marketplace.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const installations = await listInstallationsByOrganization(user.organizationId!);

  return NextResponse.json({ items: installations });
}
