import { prisma } from "@/server/db/client";

import type { UsageSnapshot } from "@/modules/billing/contracts";

function getMonthRange(referenceDate: Date): { periodStart: Date; periodEnd: Date } {
  const periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1));

  return { periodStart, periodEnd };
}

export async function getUsageRecord(input: {
  organizationId: string;
  metric: string;
  referenceDate?: Date;
}): Promise<UsageSnapshot | null> {
  const { periodStart, periodEnd } = getMonthRange(input.referenceDate ?? new Date());

  return prisma.usageRecord.findFirst({
    where: {
      organizationId: input.organizationId,
      metric: input.metric,
      periodStart,
      periodEnd,
    },
    select: {
      id: true,
      organizationId: true,
      metric: true,
      periodStart: true,
      periodEnd: true,
      quantity: true,
    },
  });
}

export async function incrementUsageRecord(input: {
  organizationId: string;
  metric: string;
  amount: number;
  referenceDate?: Date;
}): Promise<UsageSnapshot> {
  const { periodStart, periodEnd } = getMonthRange(input.referenceDate ?? new Date());

  const existing = await getUsageRecord({
    organizationId: input.organizationId,
    metric: input.metric,
    referenceDate: input.referenceDate,
  });

  if (existing) {
    return prisma.usageRecord.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + input.amount,
      },
      select: {
        id: true,
        organizationId: true,
        metric: true,
        periodStart: true,
        periodEnd: true,
        quantity: true,
      },
    });
  }

  return prisma.usageRecord.create({
    data: {
      organizationId: input.organizationId,
      metric: input.metric,
      periodStart,
      periodEnd,
      quantity: input.amount,
    },
    select: {
      id: true,
      organizationId: true,
      metric: true,
      periodStart: true,
      periodEnd: true,
      quantity: true,
    },
  });
}
