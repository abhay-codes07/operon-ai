import { prisma } from "@/server/db/client";

export async function getSystemFlag(input: { key: string; organizationId?: string | null }) {
  const orgId = input.organizationId ?? null;
  
  if (orgId !== null) {
    return prisma.systemFlag.findUnique({
      where: {
        organizationId_key: {
          organizationId: orgId,
          key: input.key,
        },
      },
    });
  }

  return prisma.systemFlag.findFirst({
    where: {
      organizationId: null,
      key: input.key,
    },
  });
}

export async function upsertSystemFlag(input: {
  key: string;
  organizationId?: string | null;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}) {
  if (input.organizationId) {
    return prisma.systemFlag.upsert({
      where: {
        organizationId_key: {
          organizationId: input.organizationId,
          key: input.key,
        },
      },
      update: {
        enabled: input.enabled,
        metadata: input.metadata,
      },
      create: {
        key: input.key,
        organizationId: input.organizationId,
        enabled: input.enabled,
        metadata: input.metadata,
      },
    });
  }

  const globalFlag = await prisma.systemFlag.findFirst({
    where: {
      organizationId: null,
      key: input.key,
    },
    select: { id: true },
  });

  if (globalFlag) {
    return prisma.systemFlag.update({
      where: { id: globalFlag.id },
      data: {
        enabled: input.enabled,
        metadata: input.metadata,
      },
    });
  }

  return prisma.systemFlag.create({
    data: {
      key: input.key,
      organizationId: null,
      enabled: input.enabled,
      metadata: input.metadata,
    },
  });
}
