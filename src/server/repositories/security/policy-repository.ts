import type { OrganizationPolicy } from "@/modules/security/schemas";
import { prisma } from "@/server/db/client";

export async function getOrganizationPolicy(organizationId: string): Promise<OrganizationPolicy | null> {
  const policy = await prisma.organizationSecurityPolicy.findUnique({
    where: { organizationId },
    select: {
      domainAllowlist: true,
      restrictedActions: true,
      allowedWindowStartHr: true,
      allowedWindowEndHr: true,
      timezone: true,
      requireHttps: true,
      metadata: true,
    },
  });

  if (!policy) {
    return null;
  }

  return {
    domainAllowlist: (policy.domainAllowlist as string[]) ?? [],
    restrictedActions: (policy.restrictedActions as string[]) ?? [],
    allowedWindowStartHr: policy.allowedWindowStartHr ?? undefined,
    allowedWindowEndHr: policy.allowedWindowEndHr ?? undefined,
    timezone: policy.timezone,
    requireHttps: policy.requireHttps,
    metadata: (policy.metadata as Record<string, unknown>) ?? undefined,
  };
}

export async function upsertOrganizationPolicy(organizationId: string, policy: OrganizationPolicy) {
  return prisma.organizationSecurityPolicy.upsert({
    where: { organizationId },
    create: {
      organizationId,
      domainAllowlist: policy.domainAllowlist,
      restrictedActions: policy.restrictedActions,
      allowedWindowStartHr: policy.allowedWindowStartHr,
      allowedWindowEndHr: policy.allowedWindowEndHr,
      timezone: policy.timezone,
      requireHttps: policy.requireHttps,
      metadata: policy.metadata,
    },
    update: {
      domainAllowlist: policy.domainAllowlist,
      restrictedActions: policy.restrictedActions,
      allowedWindowStartHr: policy.allowedWindowStartHr,
      allowedWindowEndHr: policy.allowedWindowEndHr,
      timezone: policy.timezone,
      requireHttps: policy.requireHttps,
      metadata: policy.metadata,
    },
    select: {
      id: true,
    },
  });
}
