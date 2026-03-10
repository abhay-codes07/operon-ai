import { prisma } from "@/server/db/client";

export async function getShieldTimeline(input: {
  organizationId: string;
  days?: number;
}) {
  const days = input.days ?? 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await prisma.promptInjectionEvent.findMany({
    where: {
      orgId: input.organizationId,
      detectedAt: {
        gte: since,
      },
    },
    select: {
      detectedAt: true,
      severity: true,
    },
    orderBy: {
      detectedAt: "asc",
    },
  });

  const byDay = new Map<
    string,
    {
      date: string;
      total: number;
      CRITICAL: number;
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    }
  >();

  for (const event of events) {
    const date = event.detectedAt.toISOString().slice(0, 10);
    const current =
      byDay.get(date) ??
      {
        date,
        total: 0,
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      };
    current.total += 1;
    current[event.severity] += 1;
    byDay.set(date, current);
  }

  return [...byDay.values()];
}
