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
