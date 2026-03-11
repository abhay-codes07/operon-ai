import { prisma } from "@/server/db/client";
import type { DomainMemorySnapshot } from "@/lib/autopilot/types";

function toArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export async function getDomainMemory(orgId: string, domain: string): Promise<DomainMemorySnapshot | null> {
  const memory = await prisma.domainMemory.findUnique({
    where: {
      orgId_domain: {
        orgId,
        domain,
      },
    },
  });

  if (!memory) {
    return null;
  }

  return {
    selectorPatterns: toArray(memory.selectorPatterns),
    navigationPatterns: toArray(memory.navigationPatterns),
    reliabilityScore: memory.reliabilityScore,
  };
}

export async function upsertDomainMemory(input: {
  orgId: string;
  domain: string;
  selectorPatterns: string[];
  navigationPatterns: string[];
  reliabilityScore?: number;
}) {
  const score = input.reliabilityScore ?? 0;
  return prisma.domainMemory.upsert({
    where: {
      orgId_domain: {
        orgId: input.orgId,
        domain: input.domain,
      },
    },
    create: {
      orgId: input.orgId,
      domain: input.domain,
      selectorPatterns: input.selectorPatterns,
      navigationPatterns: input.navigationPatterns,
      reliabilityScore: score,
    },
    update: {
      selectorPatterns: input.selectorPatterns,
      navigationPatterns: input.navigationPatterns,
      reliabilityScore: score,
      updatedAt: new Date(),
    },
  });
}

export async function updateMemoryFromRun(input: {
  orgId: string;
  domain: string;
  successfulSelectors: string[];
  visitedUrls: string[];
  repaired: boolean;
}) {
  const existing = await getDomainMemory(input.orgId, input.domain);

  const selectorSet = new Set([...(existing?.selectorPatterns ?? []), ...input.successfulSelectors]);
  const navigationSet = new Set([...(existing?.navigationPatterns ?? []), ...input.visitedUrls]);

  const existingScore = existing?.reliabilityScore ?? 0.5;
  const nextScore = input.repaired ? Math.max(0, existingScore - 0.05) : Math.min(1, existingScore + 0.03);

  return upsertDomainMemory({
    orgId: input.orgId,
    domain: input.domain,
    selectorPatterns: [...selectorSet].slice(-200),
    navigationPatterns: [...navigationSet].slice(-200),
    reliabilityScore: Number(nextScore.toFixed(3)),
  });
}
