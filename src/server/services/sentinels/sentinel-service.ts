import type { ChangeEvent, Workflow } from "@prisma/client";

import { prisma } from "@/server/db/client";

// ─── Types ─────────────────────────────────────────────────────────────────

export type SentinelDefinition = {
  sentinel: true;
  watchUrl: string;
  checkInterval: string;
  lastBriefing?: string;
};

export type SentinelWithStatus = Workflow & {
  definition: SentinelDefinition;
  latestSnapshot: {
    capturedAt: Date;
    domHash: string;
  } | null;
  changeCount: number;
  hasRecentChange: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function isSentinelDefinition(value: unknown): value is SentinelDefinition {
  if (!value || typeof value !== "object") return false;
  const def = value as Record<string, unknown>;
  return (
    def["sentinel"] === true &&
    typeof def["watchUrl"] === "string" &&
    typeof def["checkInterval"] === "string"
  );
}

// ─── Service Functions ──────────────────────────────────────────────────────

export async function createSentinel(input: {
  organizationId: string;
  agentId: string;
  createdById: string;
  name: string;
  watchUrl: string;
  checkInterval: string;
}): Promise<Workflow> {
  const definition: SentinelDefinition = {
    sentinel: true,
    watchUrl: input.watchUrl,
    checkInterval: input.checkInterval,
  };

  return prisma.workflow.create({
    data: {
      organizationId: input.organizationId,
      agentId: input.agentId,
      createdById: input.createdById,
      name: input.name,
      description: `Sentinel monitoring ${input.watchUrl}`,
      status: "ACTIVE",
      scheduleCron: input.checkInterval,
      definition: definition as unknown as Record<string, unknown>,
    },
  });
}

export async function listSentinels(
  organizationId: string,
): Promise<SentinelWithStatus[]> {
  // Fetch all workflows for this org that have sentinel definitions
  const workflows = await prisma.workflow.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  // Filter to only sentinel workflows
  const sentinelWorkflows = workflows.filter((wf) =>
    isSentinelDefinition(wf.definition),
  );

  if (sentinelWorkflows.length === 0) return [];

  const workflowIds = sentinelWorkflows.map((wf) => wf.id);

  // Fetch the latest page snapshot per workflow
  const snapshots = await prisma.pageSnapshot.findMany({
    where: { organizationId, workflowId: { in: workflowIds } },
    orderBy: { capturedAt: "desc" },
  });

  // Build map: workflowId → latest snapshot
  const latestSnapshotMap = new Map<
    string,
    { capturedAt: Date; domHash: string }
  >();
  for (const snap of snapshots) {
    if (snap.workflowId && !latestSnapshotMap.has(snap.workflowId)) {
      latestSnapshotMap.set(snap.workflowId, {
        capturedAt: snap.capturedAt,
        domHash: snap.domHash,
      });
    }
  }

  // Fetch change event counts per workflow
  const changeCounts = await prisma.changeEvent.groupBy({
    by: ["workflowId"],
    where: {
      organizationId,
      workflowId: { in: workflowIds },
      changeType: "MODIFIED",
    },
    _count: { id: true },
  });

  const changeCountMap = new Map<string, number>();
  for (const row of changeCounts) {
    if (row.workflowId) {
      changeCountMap.set(row.workflowId, row._count.id);
    }
  }

  // Check for recent changes (within last 24 h)
  const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentChanges = await prisma.changeEvent.findMany({
    where: {
      organizationId,
      workflowId: { in: workflowIds },
      changeType: "MODIFIED",
      detectedAt: { gte: recentCutoff },
    },
    select: { workflowId: true },
    distinct: ["workflowId"],
  });

  const recentChangeSet = new Set(
    recentChanges.map((c) => c.workflowId).filter(Boolean) as string[],
  );

  return sentinelWorkflows.map((wf) => ({
    ...wf,
    definition: wf.definition as unknown as SentinelDefinition,
    latestSnapshot: latestSnapshotMap.get(wf.id) ?? null,
    changeCount: changeCountMap.get(wf.id) ?? 0,
    hasRecentChange: recentChangeSet.has(wf.id),
  }));
}

export async function getSentinelChangeHistory(
  sentinelId: string,
  organizationId: string,
): Promise<ChangeEvent[]> {
  return prisma.changeEvent.findMany({
    where: { workflowId: sentinelId, organizationId },
    orderBy: { detectedAt: "desc" },
    take: 50,
  });
}
