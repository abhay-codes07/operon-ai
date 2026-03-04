import { prisma } from "@/server/db/client";

export async function getSystemFlag(input: { key: string; organizationId?: string | null }) {
  return prisma.systemFlag.findUnique({
    where: {
      organizationId_key: {
        organizationId: input.organizationId ?? null,
        key: input.key,
      },
    },
  });
}

export async function upsertSystemFlag(input: {
  key: string;
  organizationId?: string | null;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}) {
  return prisma.systemFlag.upsert({
    where: {
      organizationId_key: {
        organizationId: input.organizationId ?? null,
        key: input.key,
      },
    },
    update: {
      enabled: input.enabled,
      metadata: input.metadata,
    },
    create: {
      key: input.key,
      organizationId: input.organizationId ?? null,
      enabled: input.enabled,
      metadata: input.metadata,
    },
  });
}
