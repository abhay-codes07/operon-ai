import { prisma } from "@/server/db/client";

export async function createCompetitor(input: {
  orgId: string;
  name: string;
  website: string;
}) {
  return prisma.competitor.create({
    data: {
      orgId: input.orgId,
      name: input.name,
      website: input.website,
    },
  });
}

export async function listCompetitors(orgId: string) {
  return prisma.competitor.findMany({
    where: { orgId },
    include: {
      signals: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
