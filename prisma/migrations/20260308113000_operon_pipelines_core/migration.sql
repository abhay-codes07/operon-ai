-- Operon Pipelines core schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PipelineRunStatus') THEN
    CREATE TYPE "PipelineRunStatus" AS ENUM ('RUNNING', 'PAUSED', 'FAILED', 'COMPLETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PipelineStepRunStatus') THEN
    CREATE TYPE "PipelineStepRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Pipeline" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PipelineStep" (
  "id" TEXT NOT NULL,
  "pipelineId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "inputMapping" JSONB NOT NULL,
  "outputMapping" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PipelineStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PipelineRun" (
  "id" TEXT NOT NULL,
  "pipelineId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "status" "PipelineRunStatus" NOT NULL DEFAULT 'RUNNING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "inputPayload" JSONB,
  "contextPayload" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PipelineStepRun" (
  "id" TEXT NOT NULL,
  "pipelineRunId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "agentRunId" TEXT,
  "status" "PipelineStepRunStatus" NOT NULL DEFAULT 'QUEUED',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "inputPayload" JSONB,
  "outputPayload" JSONB,
  "errorMessage" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PipelineStepRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Pipeline"
  ADD CONSTRAINT "Pipeline_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PipelineStep"
  ADD CONSTRAINT "PipelineStep_pipelineId_fkey"
  FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineStep"
  ADD CONSTRAINT "PipelineStep_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PipelineRun"
  ADD CONSTRAINT "PipelineRun_pipelineId_fkey"
  FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineRun"
  ADD CONSTRAINT "PipelineRun_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PipelineStepRun"
  ADD CONSTRAINT "PipelineStepRun_pipelineRunId_fkey"
  FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineStepRun"
  ADD CONSTRAINT "PipelineStepRun_stepId_fkey"
  FOREIGN KEY ("stepId") REFERENCES "PipelineStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineStepRun"
  ADD CONSTRAINT "PipelineStepRun_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineStepRun"
  ADD CONSTRAINT "PipelineStepRun_agentRunId_fkey"
  FOREIGN KEY ("agentRunId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Pipeline_orgId_name_key" ON "Pipeline"("orgId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "PipelineStep_pipelineId_stepOrder_key" ON "PipelineStep"("pipelineId", "stepOrder");

CREATE INDEX IF NOT EXISTS "Pipeline_orgId_createdAt_idx" ON "Pipeline"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "PipelineStep_pipelineId_stepOrder_idx" ON "PipelineStep"("pipelineId", "stepOrder");
CREATE INDEX IF NOT EXISTS "PipelineStep_agentId_createdAt_idx" ON "PipelineStep"("agentId", "createdAt");
CREATE INDEX IF NOT EXISTS "PipelineRun_orgId_status_startedAt_idx" ON "PipelineRun"("orgId", "status", "startedAt");
CREATE INDEX IF NOT EXISTS "PipelineRun_pipelineId_startedAt_idx" ON "PipelineRun"("pipelineId", "startedAt");
CREATE INDEX IF NOT EXISTS "PipelineStepRun_pipelineRunId_status_createdAt_idx" ON "PipelineStepRun"("pipelineRunId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "PipelineStepRun_orgId_status_createdAt_idx" ON "PipelineStepRun"("orgId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "PipelineStepRun_agentRunId_idx" ON "PipelineStepRun"("agentRunId");
