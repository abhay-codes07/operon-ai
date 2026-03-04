import { createHash } from "crypto";

import {
  createChangeEvent,
  createPageSnapshot,
  findLatestSnapshotForUrl,
  listRecentChangeEvents,
} from "@/server/repositories/monitoring/change-radar-repository";

function computeDomHash(dom: string) {
  return createHash("sha256").update(dom).digest("hex");
}

function classifySeverity(previousHash: string, currentHash: string) {
  const prefixMatches = previousHash.slice(0, 8) === currentHash.slice(0, 8);
  return prefixMatches ? "LOW" : "MEDIUM";
}

export async function registerPageSnapshot(input: {
  organizationId: string;
  executionId: string;
  workflowId?: string;
  url: string;
  domContent: string;
  snapshotRef?: string;
}) {
  const domHash = computeDomHash(input.domContent);
  const previous = await findLatestSnapshotForUrl({
    organizationId: input.organizationId,
    workflowId: input.workflowId,
    url: input.url,
  });

  const snapshot = await createPageSnapshot({
    organizationId: input.organizationId,
    executionId: input.executionId,
    workflowId: input.workflowId,
    url: input.url,
    domHash,
    snapshotRef: input.snapshotRef,
  });

  if (!previous) {
    await createChangeEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      workflowId: input.workflowId,
      pageSnapshotId: snapshot.id,
      changeType: "ADDED",
      severity: "LOW",
      currentHash: domHash,
      details: { baseline: true },
    });

    return snapshot;
  }

  if (previous.domHash !== domHash) {
    await createChangeEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      workflowId: input.workflowId,
      pageSnapshotId: snapshot.id,
      changeType: "MODIFIED",
      severity: classifySeverity(previous.domHash, domHash),
      previousHash: previous.domHash,
      currentHash: domHash,
      details: {
        previousCapturedAt: previous.capturedAt,
      },
    });
  }

  return snapshot;
}

export async function fetchChangeRadarFeed(organizationId: string) {
  return listRecentChangeEvents(organizationId);
}
