-- Operon FinOps: Agent Cost Intelligence
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentCostEventType') THEN
    CREATE TYPE "AgentCostEventType" AS ENUM ('LLM_CALL', 'BROWSER_RUNTIME', 'RETRY', 'SELF_HEALING');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AgentCostEvent" (
  "id" TEXT NOT NULL,
  "runId" TEXT,
  "workflowId" TEXT,
  "pipelineRunId" TEXT,
  "eventType" "AgentCostEventType" NOT NULL,
  "costUsd" DECIMAL(12,6) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentCostEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkflowCostSummary" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "totalCost" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "totalRuns" INTEGER NOT NULL DEFAULT 0,
  "avgCostPerRun" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowCostSummary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CostBudget" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "monthlyBudgetUsd" DECIMAL(12,2) NOT NULL,
  "alertThresholdPercent" INTEGER NOT NULL DEFAULT 80,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CostAnomaly" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "runId" TEXT,
  "expectedCost" DECIMAL(12,6) NOT NULL,
  "actualCost" DECIMAL(12,6) NOT NULL,
  "anomalyFactor" DECIMAL(8,3) NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostAnomaly_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AgentCostEvent"
  ADD CONSTRAINT "AgentCostEvent_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentCostEvent"
  ADD CONSTRAINT "AgentCostEvent_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentCostEvent"
  ADD CONSTRAINT "AgentCostEvent_pipelineRunId_fkey"
  FOREIGN KEY ("pipelineRunId") REFERENCES "PipelineRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowCostSummary"
  ADD CONSTRAINT "WorkflowCostSummary_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CostBudget"
  ADD CONSTRAINT "CostBudget_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostBudget"
  ADD CONSTRAINT "CostBudget_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CostAnomaly"
  ADD CONSTRAINT "CostAnomaly_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostAnomaly"
  ADD CONSTRAINT "CostAnomaly_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowCostSummary_workflowId_key"
  ON "WorkflowCostSummary"("workflowId");
CREATE UNIQUE INDEX IF NOT EXISTS "CostBudget_orgId_workflowId_key"
  ON "CostBudget"("orgId", "workflowId");

CREATE INDEX IF NOT EXISTS "AgentCostEvent_runId_createdAt_idx"
  ON "AgentCostEvent"("runId", "createdAt");
CREATE INDEX IF NOT EXISTS "AgentCostEvent_workflowId_createdAt_idx"
  ON "AgentCostEvent"("workflowId", "createdAt");
CREATE INDEX IF NOT EXISTS "AgentCostEvent_pipelineRunId_createdAt_idx"
  ON "AgentCostEvent"("pipelineRunId", "createdAt");
CREATE INDEX IF NOT EXISTS "AgentCostEvent_eventType_createdAt_idx"
  ON "AgentCostEvent"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "WorkflowCostSummary_lastUpdated_idx"
  ON "WorkflowCostSummary"("lastUpdated");
CREATE INDEX IF NOT EXISTS "CostBudget_orgId_createdAt_idx"
  ON "CostBudget"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "CostAnomaly_workflowId_createdAt_idx"
  ON "CostAnomaly"("workflowId", "createdAt");
CREATE INDEX IF NOT EXISTS "CostAnomaly_runId_idx"
  ON "CostAnomaly"("runId");
