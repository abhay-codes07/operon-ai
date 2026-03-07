import { prisma } from "@/server/db/client";

function computeFreshnessFactor(publishedAt?: Date | null): number {
  if (!publishedAt) {
    return 0.1;
  }

  const ageDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 14) {
    return 1;
  }
  if (ageDays <= 30) {
    return 0.5;
  }
  return 0.1;
}

export async function recomputeTemplateReliabilityScore(templateId: string) {
  const template = await prisma.marketplaceTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        where: { isLatest: true },
        take: 1,
        orderBy: { publishedAt: "desc" },
      },
      installations: {
        select: {
          orgId: true,
        },
      },
    },
  });

  if (!template) {
    return null;
  }

  const orgIds = [...new Set(template.installations.map((item) => item.orgId))];
  const executionAggregate =
    orgIds.length === 0
      ? { total: 0, succeeded: 0 }
      : await prisma.execution.groupBy({
          by: ["status"],
          where: {
            organizationId: { in: orgIds },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _count: {
            _all: true,
          },
        }).then((rows) => ({
          total: rows.reduce((acc, row) => acc + row._count._all, 0),
          succeeded: rows
            .filter((row) => row.status === "SUCCEEDED")
            .reduce((acc, row) => acc + row._count._all, 0),
        }));

  const avgSuccessRate = executionAggregate.total === 0 ? 0.8 : executionAggregate.succeeded / executionAggregate.total;
  const recentUpdates = computeFreshnessFactor(template.versions[0]?.publishedAt);

  const successRateScore = avgSuccessRate * 50;
  const ratingScore = (template.avgRating / 5) * 30;
  const freshnessScore = recentUpdates * 20;
  const overallScore = Number((successRateScore + ratingScore + freshnessScore).toFixed(2));

  await prisma.marketplaceTemplate.update({
    where: { id: templateId },
    data: {
      reliabilityScore: overallScore,
    },
  });

  return {
    templateId,
    overallScore,
    breakdown: {
      successRateScore: Number(successRateScore.toFixed(2)),
      ratingScore: Number(ratingScore.toFixed(2)),
      freshnessScore: Number(freshnessScore.toFixed(2)),
    },
  };
}

export async function recomputeAllTemplateReliabilityScores() {
  const templates = await prisma.marketplaceTemplate.findMany({
    select: { id: true },
  });

  const results = [] as Array<{
    templateId: string;
    overallScore: number;
    breakdown: {
      successRateScore: number;
      ratingScore: number;
      freshnessScore: number;
    };
  }>;

  for (const template of templates) {
    const score = await recomputeTemplateReliabilityScore(template.id);
    if (score) {
      results.push(score);
    }
  }

  return results;
}
