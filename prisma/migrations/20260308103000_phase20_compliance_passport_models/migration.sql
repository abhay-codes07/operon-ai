-- Phase 20 AI Agent Compliance Passport models

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ComplianceActionType') THEN
    CREATE TYPE "ComplianceActionType" AS ENUM ('READ', 'WRITE', 'SUBMIT', 'EXTRACT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ComplianceRiskLevel') THEN
    CREATE TYPE "ComplianceRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "WorkflowComplianceApproval" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "approvedByUserId" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvalNotes" TEXT,
  "revokedAt" TIMESTAMP(3),
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "WorkflowComplianceApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ComplianceEvent" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "runId" TEXT,
  "domainVisited" TEXT,
  "actionType" "ComplianceActionType" NOT NULL,
  "dataCategory" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "ComplianceEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompliancePassport" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "lastGeneratedAt" TIMESTAMP(3),
  "riskLevel" "ComplianceRiskLevel" NOT NULL DEFAULT 'LOW',
  "summaryText" TEXT,
  "reportUrl" TEXT,
  CONSTRAINT "CompliancePassport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ComplianceViolation" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "runId" TEXT,
  "violationType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "ComplianceViolation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkflowComplianceApproval"
  ADD CONSTRAINT "WorkflowComplianceApproval_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowComplianceApproval"
  ADD CONSTRAINT "WorkflowComplianceApproval_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowComplianceApproval"
  ADD CONSTRAINT "WorkflowComplianceApproval_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComplianceEvent"
  ADD CONSTRAINT "ComplianceEvent_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceEvent"
  ADD CONSTRAINT "ComplianceEvent_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceEvent"
  ADD CONSTRAINT "ComplianceEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompliancePassport"
  ADD CONSTRAINT "CompliancePassport_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComplianceViolation"
  ADD CONSTRAINT "ComplianceViolation_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceViolation"
  ADD CONSTRAINT "ComplianceViolation_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceViolation"
  ADD CONSTRAINT "ComplianceViolation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "WorkflowComplianceApproval_organizationId_workflowId_approvedAt_idx"
  ON "WorkflowComplianceApproval"("organizationId", "workflowId", "approvedAt");
CREATE INDEX IF NOT EXISTS "WorkflowComplianceApproval_workflowId_revokedAt_idx"
  ON "WorkflowComplianceApproval"("workflowId", "revokedAt");

CREATE INDEX IF NOT EXISTS "ComplianceEvent_organizationId_workflowId_timestamp_idx"
  ON "ComplianceEvent"("organizationId", "workflowId", "timestamp");
CREATE INDEX IF NOT EXISTS "ComplianceEvent_runId_timestamp_idx"
  ON "ComplianceEvent"("runId", "timestamp");

CREATE UNIQUE INDEX IF NOT EXISTS "CompliancePassport_workflowId_key"
  ON "CompliancePassport"("workflowId");

CREATE INDEX IF NOT EXISTS "ComplianceViolation_organizationId_detectedAt_idx"
  ON "ComplianceViolation"("organizationId", "detectedAt");
CREATE INDEX IF NOT EXISTS "ComplianceViolation_workflowId_detectedAt_idx"
  ON "ComplianceViolation"("workflowId", "detectedAt");
CREATE INDEX IF NOT EXISTS "ComplianceViolation_runId_idx"
  ON "ComplianceViolation"("runId");
