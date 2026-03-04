import { NextResponse } from "next/server";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { organizationPolicySchema } from "@/modules/security/schemas";
import { fetchOrganizationPolicy, saveOrganizationPolicy } from "@/server/security/policy-engine";

export async function GET() {
  const user = await requireOrganizationRole("ADMIN");
  const policy = await fetchOrganizationPolicy(user.organizationId!);

  return NextResponse.json({
    policy:
      policy ?? {
        domainAllowlist: [],
        restrictedActions: [],
        timezone: "UTC",
        requireHttps: true,
      },
  });
}

export async function PUT(request: Request) {
  const user = await requireOrganizationRole("OWNER");
  const { data, error } = await parseJsonBody(request, organizationPolicySchema);
  if (error) {
    return error;
  }

  const policy = await saveOrganizationPolicy({
    organizationId: user.organizationId!,
    policy: data,
  });

  return NextResponse.json({ policy });
}
