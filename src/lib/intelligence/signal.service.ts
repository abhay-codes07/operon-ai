import { prisma } from "@/server/db/client";

export async function listSignals(orgId: string, limit = 200) {
  return prisma.competitorSignal.findMany({
    where: {
      orgId,
    },
    include: {
      competitor: {
        select: {
          id: true,
          name: true,
          website: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function aggregateSignalsByType(orgId: string) {
  const rows = await prisma.competitorSignal.groupBy({
    by: ["signalType"],
    where: { orgId },
    _count: { _all: true },
  });

  return rows.map((row) => ({
    signalType: row.signalType,
    count: row._count._all,
  }));
}

export async function detectMeaningfulSignals(orgId: string) {
  const signals = await listSignals(orgId, 400);
  return signals.filter((signal) => {
    const payload = signal.payload as Record<string, unknown>;
    if (signal.signalType === "PRICING_CHANGE") {
      return Array.isArray(payload.plans) && payload.plans.length > 0;
    }
    if (signal.signalType === "JOB_POSTING") {
      return typeof payload.delta === "number" && payload.delta > 5;
    }
    if (signal.signalType === "HEADCOUNT_CHANGE") {
      return typeof payload.hiringVelocity === "number" && payload.hiringVelocity > 20;
    }
    return true;
  });
}
