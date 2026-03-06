-- Phase 17 progressive workflow delivery and auto rollback

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowReleaseStatus') THEN
    CREATE TYPE "WorkflowReleaseStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ROLLED_BACK', 'COMPLETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReleaseLane') THEN
    CREATE TYPE "ReleaseLane" AS ENUM ('STABLE', 'CANARY');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "WorkflowRelease" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "stableWorkflowId" TEXT NOT NULL,
  "canaryWorkflowId" TEXT NOT NULL,
  "status" "WorkflowReleaseStatus" NOT NULL DEFAULT 'ACTIVE',
  "canaryTrafficPercent" INTEGER NOT NULL DEFAULT 10,
  "autoRollbackEnabled" BOOLEAN NOT NULL DEFAULT true,
  "failureThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 20,
  "minCanarySampleSize" INTEGER NOT NULL DEFAULT 20,
  "totalRouted" INTEGER NOT NULL DEFAULT 0,
  "stableRouted" INTEGER NOT NULL DEFAULT 0,
  "canaryRouted" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowRelease_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReleaseRoutingLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowReleaseId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "lane" "ReleaseLane" NOT NULL,
  "status" "ExecutionStatus" NOT NULL DEFAULT 'QUEUED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReleaseRoutingLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReleaseMetricSnapshot" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowReleaseId" TEXT NOT NULL,
  "canarySampleSize" INTEGER NOT NULL,
  "canaryFailurePct" DOUBLE PRECISION NOT NULL,
  "canarySuccessPct" DOUBLE PRECISION NOT NULL,
  "stableSampleSize" INTEGER NOT NULL,
  "stableFailurePct" DOUBLE PRECISION NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReleaseMetricSnapshot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkflowRelease"
  ADD CONSTRAINT "WorkflowRelease_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRelease"
  ADD CONSTRAINT "WorkflowRelease_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRelease"
  ADD CONSTRAINT "WorkflowRelease_stableWorkflowId_fkey"
  FOREIGN KEY ("stableWorkflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRelease"
  ADD CONSTRAINT "WorkflowRelease_canaryWorkflowId_fkey"
  FOREIGN KEY ("canaryWorkflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReleaseRoutingLog"
  ADD CONSTRAINT "ReleaseRoutingLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseRoutingLog"
  ADD CONSTRAINT "ReleaseRoutingLog_workflowReleaseId_fkey"
  FOREIGN KEY ("workflowReleaseId") REFERENCES "WorkflowRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseRoutingLog"
  ADD CONSTRAINT "ReleaseRoutingLog_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseRoutingLog"
  ADD CONSTRAINT "ReleaseRoutingLog_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReleaseMetricSnapshot"
  ADD CONSTRAINT "ReleaseMetricSnapshot_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseMetricSnapshot"
  ADD CONSTRAINT "ReleaseMetricSnapshot_workflowReleaseId_fkey"
  FOREIGN KEY ("workflowReleaseId") REFERENCES "WorkflowRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "WorkflowRelease_organizationId_status_updatedAt_idx"
  ON "WorkflowRelease"("organizationId", "status", "updatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowRelease_organizationId_stableWorkflowId_canaryWorkflowId_key"
  ON "WorkflowRelease"("organizationId", "stableWorkflowId", "canaryWorkflowId");

CREATE UNIQUE INDEX IF NOT EXISTS "ReleaseRoutingLog_executionId_key"
  ON "ReleaseRoutingLog"("executionId");
CREATE INDEX IF NOT EXISTS "ReleaseRoutingLog_organizationId_workflowReleaseId_createdAt_idx"
  ON "ReleaseRoutingLog"("organizationId", "workflowReleaseId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReleaseRoutingLog_organizationId_lane_createdAt_idx"
  ON "ReleaseRoutingLog"("organizationId", "lane", "createdAt");

CREATE INDEX IF NOT EXISTS "ReleaseMetricSnapshot_organizationId_workflowReleaseId_capturedAt_idx"
  ON "ReleaseMetricSnapshot"("organizationId", "workflowReleaseId", "capturedAt");
