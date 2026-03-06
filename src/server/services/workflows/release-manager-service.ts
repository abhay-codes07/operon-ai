import type { ExecutionStatus } from "@prisma/client";

import {
  createReleaseMetricSnapshot,
  createReleaseRoutingLog,
  createWorkflowRelease,
  findActiveReleaseByWorkflow,
  getWorkflowRelease,
  incrementReleaseRouting,
  listReleaseRoutingLogs,
  listWorkflowReleases,
  updateReleaseRoutingStatus,
  updateReleaseStatus,
} from "@/server/repositories/workflows/release-repository";

export async function createProgressiveRelease(input: {
  organizationId: string;
  agentId: string;
  stableWorkflowId: string;
  canaryWorkflowId: string;
  canaryTrafficPercent: number;
  autoRollbackEnabled?: boolean;
  failureThresholdPct?: number;
  minCanarySampleSize?: number;
}) {
  return createWorkflowRelease({
    organizationId: input.organizationId,
    agentId: input.agentId,
    stableWorkflowId: input.stableWorkflowId,
    canaryWorkflowId: input.canaryWorkflowId,
    canaryTrafficPercent: Math.max(1, Math.min(95, input.canaryTrafficPercent)),
    autoRollbackEnabled: input.autoRollbackEnabled ?? true,
    failureThresholdPct: input.failureThresholdPct ?? 20,
    minCanarySampleSize: input.minCanarySampleSize ?? 20,
  });
}

export async function fetchReleaseDashboard(organizationId: string) {
  return listWorkflowReleases(organizationId);
}

export async function resolveWorkflowForExecution(input: {
  organizationId: string;
  workflowId: string;
}) {
  const release = await findActiveReleaseByWorkflow({
    organizationId: input.organizationId,
    workflowId: input.workflowId,
  });
  if (!release) {
    return {
      workflowId: input.workflowId,
      releaseId: null,
      lane: "STABLE" as const,
    };
  }

  const randomBucket = Math.random() * 100;
  const lane = randomBucket < release.canaryTrafficPercent ? "CANARY" : "STABLE";
  return {
    workflowId: lane === "CANARY" ? release.canaryWorkflowId : release.stableWorkflowId,
    releaseId: release.id,
    lane,
  };
}

export async function registerReleaseRouting(input: {
  organizationId: string;
  releaseId: string;
  executionId: string;
  workflowId: string;
  lane: "STABLE" | "CANARY";
}) {
  await createReleaseRoutingLog({
    organizationId: input.organizationId,
    workflowReleaseId: input.releaseId,
    executionId: input.executionId,
    workflowId: input.workflowId,
    lane: input.lane,
  });

  await incrementReleaseRouting({
    organizationId: input.organizationId,
    workflowReleaseId: input.releaseId,
    lane: input.lane,
  });
}

function summarizeFailures(items: Array<{ status: ExecutionStatus }>) {
  if (items.length === 0) {
    return 0;
  }
  const failures = items.filter((item) => item.status === "FAILED" || item.status === "CANCELED").length;
  return Number(((failures / items.length) * 100).toFixed(2));
}

export async function recordReleaseExecutionOutcome(input: {
  organizationId: string;
  executionId: string;
  status: ExecutionStatus;
}) {
  await updateReleaseRoutingStatus({
    organizationId: input.organizationId,
    executionId: input.executionId,
    status: input.status,
  });
}

export async function evaluateReleaseHealth(input: {
  organizationId: string;
  releaseId: string;
}) {
  const release = await getWorkflowRelease({
    organizationId: input.organizationId,
    workflowReleaseId: input.releaseId,
  });
  if (!release) {
    return { evaluated: false, rolledBack: false };
  }

  const [canaryLogs, stableLogs] = await Promise.all([
    listReleaseRoutingLogs({
      organizationId: input.organizationId,
      workflowReleaseId: release.id,
      lane: "CANARY",
      limit: 200,
    }),
    listReleaseRoutingLogs({
      organizationId: input.organizationId,
      workflowReleaseId: release.id,
      lane: "STABLE",
      limit: 200,
    }),
  ]);

  const canaryFailurePct = summarizeFailures(canaryLogs);
  const stableFailurePct = summarizeFailures(stableLogs);
  const canarySuccessPct = Number((100 - canaryFailurePct).toFixed(2));

  await createReleaseMetricSnapshot({
    organizationId: input.organizationId,
    workflowReleaseId: release.id,
    canarySampleSize: canaryLogs.length,
    canaryFailurePct,
    canarySuccessPct,
    stableSampleSize: stableLogs.length,
    stableFailurePct,
  });

  if (
    release.autoRollbackEnabled &&
    canaryLogs.length >= release.minCanarySampleSize &&
    canaryFailurePct > release.failureThresholdPct
  ) {
    await updateReleaseStatus({
      organizationId: input.organizationId,
      workflowReleaseId: release.id,
      status: "ROLLED_BACK",
    });
    return { evaluated: true, rolledBack: true };
  }

  return { evaluated: true, rolledBack: false };
}

export async function rollbackRelease(input: { organizationId: string; releaseId: string }) {
  await updateReleaseStatus({
    organizationId: input.organizationId,
    workflowReleaseId: input.releaseId,
    status: "ROLLED_BACK",
  });
}
