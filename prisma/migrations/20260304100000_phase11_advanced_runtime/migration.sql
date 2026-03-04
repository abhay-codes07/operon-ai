-- Phase 11 advanced runtime models: replay, self-healing, memory, guardrails, simulation

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExecutionStepStatus') THEN
    CREATE TYPE "ExecutionStepStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemoryKind') THEN
    CREATE TYPE "MemoryKind" AS ENUM ('RUN_METADATA', 'PATTERN', 'FAILURE_RESOLUTION');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SimulationStatus') THEN
    CREATE TYPE "SimulationStatus" AS ENUM ('READY', 'FAILED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "ExecutionStep" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stepIndex" INTEGER NOT NULL,
  "stepKey" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target" TEXT,
  "status" "ExecutionStepStatus" NOT NULL DEFAULT 'PENDING',
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutionStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DomSnapshot" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "executionStepId" TEXT,
  "organizationId" TEXT NOT NULL,
  "pageUrl" TEXT,
  "domHtml" TEXT NOT NULL,
  "metadata" JSONB,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DomSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SelfHealingRecord" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "executionStepId" TEXT,
  "originalSelector" TEXT,
  "resolvedSelector" TEXT NOT NULL,
  "strategy" TEXT NOT NULL,
  "similarityScore" DOUBLE PRECISION NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SelfHealingRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentMemory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "workflowId" TEXT,
  "sourceExecutionId" TEXT,
  "kind" "MemoryKind" NOT NULL,
  "memoryKey" TEXT NOT NULL,
  "memoryValue" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrganizationSecurityPolicy" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "domainAllowlist" JSONB NOT NULL,
  "restrictedActions" JSONB NOT NULL,
  "allowedWindowStartHr" INTEGER,
  "allowedWindowEndHr" INTEGER,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "requireHttps" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationSecurityPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkflowSimulation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "requestedById" TEXT,
  "status" "SimulationStatus" NOT NULL DEFAULT 'READY',
  "predictedPath" JSONB NOT NULL,
  "warnings" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowSimulation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExecutionStep"
  ADD CONSTRAINT "ExecutionStep_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExecutionStep"
  ADD CONSTRAINT "ExecutionStep_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DomSnapshot"
  ADD CONSTRAINT "DomSnapshot_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DomSnapshot"
  ADD CONSTRAINT "DomSnapshot_executionStepId_fkey"
  FOREIGN KEY ("executionStepId") REFERENCES "ExecutionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DomSnapshot"
  ADD CONSTRAINT "DomSnapshot_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SelfHealingRecord"
  ADD CONSTRAINT "SelfHealingRecord_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SelfHealingRecord"
  ADD CONSTRAINT "SelfHealingRecord_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SelfHealingRecord"
  ADD CONSTRAINT "SelfHealingRecord_executionStepId_fkey"
  FOREIGN KEY ("executionStepId") REFERENCES "ExecutionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentMemory"
  ADD CONSTRAINT "AgentMemory_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentMemory"
  ADD CONSTRAINT "AgentMemory_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentMemory"
  ADD CONSTRAINT "AgentMemory_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentMemory"
  ADD CONSTRAINT "AgentMemory_sourceExecutionId_fkey"
  FOREIGN KEY ("sourceExecutionId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrganizationSecurityPolicy"
  ADD CONSTRAINT "OrganizationSecurityPolicy_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowSimulation"
  ADD CONSTRAINT "WorkflowSimulation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowSimulation"
  ADD CONSTRAINT "WorkflowSimulation_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowSimulation"
  ADD CONSTRAINT "WorkflowSimulation_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "ExecutionStep_executionId_stepIndex_key"
  ON "ExecutionStep"("executionId", "stepIndex");
CREATE INDEX IF NOT EXISTS "ExecutionStep_organizationId_executionId_stepIndex_idx"
  ON "ExecutionStep"("organizationId", "executionId", "stepIndex");
CREATE INDEX IF NOT EXISTS "DomSnapshot_organizationId_executionId_capturedAt_idx"
  ON "DomSnapshot"("organizationId", "executionId", "capturedAt");
CREATE INDEX IF NOT EXISTS "DomSnapshot_executionStepId_capturedAt_idx"
  ON "DomSnapshot"("executionStepId", "capturedAt");
CREATE INDEX IF NOT EXISTS "SelfHealingRecord_organizationId_executionId_createdAt_idx"
  ON "SelfHealingRecord"("organizationId", "executionId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AgentMemory_organizationId_agentId_workflowId_memoryKey_key"
  ON "AgentMemory"("organizationId", "agentId", "workflowId", "memoryKey");
CREATE INDEX IF NOT EXISTS "AgentMemory_organizationId_agentId_kind_updatedAt_idx"
  ON "AgentMemory"("organizationId", "agentId", "kind", "updatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationSecurityPolicy_organizationId_key"
  ON "OrganizationSecurityPolicy"("organizationId");
CREATE INDEX IF NOT EXISTS "WorkflowSimulation_organizationId_workflowId_createdAt_idx"
  ON "WorkflowSimulation"("organizationId", "workflowId", "createdAt");
