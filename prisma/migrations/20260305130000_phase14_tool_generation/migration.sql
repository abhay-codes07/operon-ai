-- Phase 14 dynamic tool generation models

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ToolExecutionStatus') THEN
    CREATE TYPE "ToolExecutionStatus" AS ENUM ('SUCCEEDED', 'FAILED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "Tool" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByAgentId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currentVersionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ToolVersion" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "workflowSteps" JSONB NOT NULL,
  "validationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "validated" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ToolVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ToolExecution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "toolVersionId" TEXT NOT NULL,
  "executionId" TEXT,
  "status" "ToolExecutionStatus" NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "output" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ToolExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ToolInstallation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "toolVersionId" TEXT NOT NULL,
  "installedById" TEXT,
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ToolInstallation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Tool"
  ADD CONSTRAINT "Tool_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tool"
  ADD CONSTRAINT "Tool_createdByAgentId_fkey"
  FOREIGN KEY ("createdByAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ToolVersion"
  ADD CONSTRAINT "ToolVersion_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolVersion"
  ADD CONSTRAINT "ToolVersion_toolId_fkey"
  FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tool"
  ADD CONSTRAINT "Tool_currentVersionId_fkey"
  FOREIGN KEY ("currentVersionId") REFERENCES "ToolVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ToolExecution"
  ADD CONSTRAINT "ToolExecution_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolExecution"
  ADD CONSTRAINT "ToolExecution_toolId_fkey"
  FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolExecution"
  ADD CONSTRAINT "ToolExecution_toolVersionId_fkey"
  FOREIGN KEY ("toolVersionId") REFERENCES "ToolVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolExecution"
  ADD CONSTRAINT "ToolExecution_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ToolInstallation"
  ADD CONSTRAINT "ToolInstallation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolInstallation"
  ADD CONSTRAINT "ToolInstallation_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolInstallation"
  ADD CONSTRAINT "ToolInstallation_toolId_fkey"
  FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolInstallation"
  ADD CONSTRAINT "ToolInstallation_toolVersionId_fkey"
  FOREIGN KEY ("toolVersionId") REFERENCES "ToolVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolInstallation"
  ADD CONSTRAINT "ToolInstallation_installedById_fkey"
  FOREIGN KEY ("installedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Tool_organizationId_name_key" ON "Tool"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "Tool_organizationId_reliabilityScore_usageCount_idx"
  ON "Tool"("organizationId", "reliabilityScore", "usageCount");
CREATE UNIQUE INDEX IF NOT EXISTS "ToolVersion_toolId_versionNumber_key" ON "ToolVersion"("toolId", "versionNumber");
CREATE INDEX IF NOT EXISTS "ToolVersion_organizationId_validated_createdAt_idx"
  ON "ToolVersion"("organizationId", "validated", "createdAt");
CREATE INDEX IF NOT EXISTS "ToolExecution_organizationId_toolId_createdAt_idx"
  ON "ToolExecution"("organizationId", "toolId", "createdAt");
CREATE INDEX IF NOT EXISTS "ToolExecution_organizationId_status_createdAt_idx"
  ON "ToolExecution"("organizationId", "status", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ToolInstallation_workflowId_toolId_key" ON "ToolInstallation"("workflowId", "toolId");
CREATE INDEX IF NOT EXISTS "ToolInstallation_organizationId_workflowId_createdAt_idx"
  ON "ToolInstallation"("organizationId", "workflowId", "createdAt");
