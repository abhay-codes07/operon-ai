-- Phase 13 control plane models for real-time operations

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExecutionControlAction') THEN
    CREATE TYPE "ExecutionControlAction" AS ENUM ('PAUSE', 'RESUME', 'STEP', 'OVERRIDE_ACTION', 'STOP');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExecutionControlCommandStatus') THEN
    CREATE TYPE "ExecutionControlCommandStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalRequestStatus') THEN
    CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
  END IF;
END$$;

ALTER TABLE "Execution" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Execution" ADD COLUMN IF NOT EXISTS "stepCursor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Execution" ADD COLUMN IF NOT EXISTS "debugMode" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ExecutionStreamEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutionStreamEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExecutionControlCommand" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "action" "ExecutionControlAction" NOT NULL,
  "status" "ExecutionControlCommandStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  CONSTRAINT "ExecutionControlCommand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT,
  "workflowId" TEXT,
  "stepKey" TEXT,
  "actionType" TEXT NOT NULL,
  "actionPayload" JSONB NOT NULL,
  "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "reviewNote" TEXT,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SystemFlag" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemFlag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DebugSession" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "userId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "selectorPatch" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DebugSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExecutionStreamEvent"
  ADD CONSTRAINT "ExecutionStreamEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionStreamEvent"
  ADD CONSTRAINT "ExecutionStreamEvent_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExecutionControlCommand"
  ADD CONSTRAINT "ExecutionControlCommand_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionControlCommand"
  ADD CONSTRAINT "ExecutionControlCommand_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SystemFlag"
  ADD CONSTRAINT "SystemFlag_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DebugSession"
  ADD CONSTRAINT "DebugSession_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DebugSession"
  ADD CONSTRAINT "DebugSession_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DebugSession"
  ADD CONSTRAINT "DebugSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "ExecutionStreamEvent_executionId_sequence_key"
  ON "ExecutionStreamEvent"("executionId", "sequence");
CREATE INDEX IF NOT EXISTS "ExecutionStreamEvent_organizationId_executionId_occurredAt_idx"
  ON "ExecutionStreamEvent"("organizationId", "executionId", "occurredAt");

CREATE INDEX IF NOT EXISTS "ExecutionControlCommand_organizationId_executionId_createdAt_idx"
  ON "ExecutionControlCommand"("organizationId", "executionId", "createdAt");
CREATE INDEX IF NOT EXISTS "ExecutionControlCommand_executionId_status_createdAt_idx"
  ON "ExecutionControlCommand"("executionId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "ApprovalRequest_organizationId_status_requestedAt_idx"
  ON "ApprovalRequest"("organizationId", "status", "requestedAt");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_executionId_status_idx"
  ON "ApprovalRequest"("executionId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "SystemFlag_organizationId_key_key"
  ON "SystemFlag"("organizationId", "key");
CREATE INDEX IF NOT EXISTS "SystemFlag_key_enabled_updatedAt_idx"
  ON "SystemFlag"("key", "enabled", "updatedAt");

CREATE INDEX IF NOT EXISTS "DebugSession_organizationId_executionId_active_idx"
  ON "DebugSession"("organizationId", "executionId", "active");
