import type { MarketplacePricingModel, Prisma, TemplateInstallationStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

export type MarketplaceTemplateFilters = {
  query?: string;
  category?: string;
  pricingModel?: MarketplacePricingModel;
  minReliabilityScore?: number;
  page?: number;
  pageSize?: number;
};

export async function listTemplates(filters: MarketplaceTemplateFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.MarketplaceTemplateWhereInput = {
    category: filters.category,
    pricingModel: filters.pricingModel,
    reliabilityScore:
      filters.minReliabilityScore === undefined ? undefined : { gte: filters.minReliabilityScore },
    OR: filters.query
      ? [
          { title: { contains: filters.query, mode: "insensitive" } },
          { description: { contains: filters.query, mode: "insensitive" } },
          { slug: { contains: filters.query, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.marketplaceTemplate.findMany({
      where,
      include: {
        versions: {
          where: { isLatest: true },
          take: 1,
          orderBy: { publishedAt: "desc" },
        },
      },
      orderBy: [{ reliabilityScore: "desc" }, { installCount: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.marketplaceTemplate.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

export async function getTemplateBySlug(slug: string) {
  return prisma.marketplaceTemplate.findUnique({
    where: { slug },
    include: {
      versions: {
        orderBy: { publishedAt: "desc" },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function incrementInstallCount(templateId: string) {
  return prisma.marketplaceTemplate.update({
    where: { id: templateId },
    data: {
      installCount: { increment: 1 },
    },
    select: {
      id: true,
      installCount: true,
    },
  });
}

export async function installTemplate(
  templateId: string,
  orgId: string,
  status: TemplateInstallationStatus = "ACTIVE",
) {
  const latestVersion = await prisma.templateVersion.findFirst({
    where: {
      templateId,
      isLatest: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  if (!latestVersion) {
    return null;
  }

  const installation = await prisma.templateInstallation.upsert({
    where: {
      templateId_orgId: {
        templateId,
        orgId,
      },
    },
    update: {
      installedVersion: latestVersion.version,
      status,
      installedAt: new Date(),
    },
    create: {
      templateId,
      orgId,
      installedVersion: latestVersion.version,
      status,
    },
  });

  await incrementInstallCount(templateId);
  return installation;
}

export async function addReview(
  templateId: string,
  orgId: string,
  rating: number,
  comment?: string,
) {
  const boundedRating = Math.max(1, Math.min(5, rating));
  await prisma.templateReview.upsert({
    where: {
      templateId_orgId: {
        templateId,
        orgId,
      },
    },
    update: {
      rating: boundedRating,
      comment,
    },
    create: {
      templateId,
      orgId,
      rating: boundedRating,
      comment,
    },
  });

  const aggregate = await prisma.templateReview.aggregate({
    where: { templateId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.marketplaceTemplate.update({
    where: { id: templateId },
    data: {
      avgRating: Number((aggregate._avg.rating ?? 0).toFixed(2)),
      reviewCount: aggregate._count.rating,
    },
  });
}

export async function listInstallationsByOrganization(orgId: string) {
  return prisma.templateInstallation.findMany({
    where: { orgId },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          title: true,
          reliabilityScore: true,
          installCount: true,
        },
      },
    },
    orderBy: {
      installedAt: "desc",
    },
  });
}

export async function createTemplate(input: {
  slug: string;
  title: string;
  description: string;
  category: string;
  authorOrgId: string;
  pricingModel: MarketplacePricingModel;
  priceUsd?: number;
  version: string;
  workflowDefinition: Record<string, unknown>;
  changelog?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const template = await tx.marketplaceTemplate.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        category: input.category,
        authorOrgId: input.authorOrgId,
        pricingModel: input.pricingModel,
        priceUsd: input.priceUsd ?? 0,
      },
    });

    const version = await tx.templateVersion.create({
      data: {
        templateId: template.id,
        version: input.version,
        workflowDefinition: input.workflowDefinition,
        changelog: input.changelog,
        isLatest: true,
      },
    });

    return { template, version };
  });
}
