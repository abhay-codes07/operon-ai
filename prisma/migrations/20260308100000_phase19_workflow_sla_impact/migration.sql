-- Phase 19 workflow SLA contracts and business impact models

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BusinessImpactCategory') THEN
    CREATE TYPE "BusinessImpactCategory" AS ENUM ('REVENUE_PROTECTION', 'COST_SAVINGS', 'COMPLIANCE', 'GROWTH');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SLABreachType') THEN
    CREATE TYPE "SLABreachType" AS ENUM ('FAILURE_RATE', 'EXECUTION_TIMEOUT', 'MISSED_SCHEDULE');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "WorkflowSLA" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "expectedSchedule" TEXT NOT NULL,
  "maxFailureRate" DOUBLE PRECISION NOT NULL,
  "maxExecutionTimeSeconds" INTEGER NOT NULL,
  "rollingWindowDays" INTEGER NOT NULL DEFAULT 7,
  "notificationSlackChannel" TEXT,
  "notificationEmail" TEXT,
  "escalationAfterBreaches" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowSLA_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkflowBusinessImpact" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "category" "BusinessImpactCategory" NOT NULL,
  "estimatedDollarValuePerRun" DOUBLE PRECISION NOT NULL,
  "teamOwner" TEXT NOT NULL,
  "businessObjective" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowBusinessImpact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SLABreachIncident" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "runId" TEXT,
  "breachType" "SLABreachType" NOT NULL,
  "breachDetails" JSONB NOT NULL,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "SLABreachIncident_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkflowSLA"
  ADD CONSTRAINT "WorkflowSLA_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowBusinessImpact"
  ADD CONSTRAINT "WorkflowBusinessImpact_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SLABreachIncident"
  ADD CONSTRAINT "SLABreachIncident_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SLABreachIncident"
  ADD CONSTRAINT "SLABreachIncident_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SLABreachIncident"
  ADD CONSTRAINT "SLABreachIncident_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowSLA_workflowId_key" ON "WorkflowSLA"("workflowId");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowBusinessImpact_workflowId_key" ON "WorkflowBusinessImpact"("workflowId");
CREATE INDEX IF NOT EXISTS "SLABreachIncident_organizationId_detectedAt_idx" ON "SLABreachIncident"("organizationId", "detectedAt");
CREATE INDEX IF NOT EXISTS "SLABreachIncident_workflowId_breachType_detectedAt_idx" ON "SLABreachIncident"("workflowId", "breachType", "detectedAt");
CREATE INDEX IF NOT EXISTS "SLABreachIncident_runId_idx" ON "SLABreachIncident"("runId");
