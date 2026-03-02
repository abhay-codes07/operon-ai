-- Phase 3 core models: Agent, Workflow, Execution, ExecutionLog

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentStatus') THEN
    CREATE TYPE "AgentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowStatus') THEN
    CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExecutionStatus') THEN
    CREATE TYPE "ExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExecutionTrigger') THEN
    CREATE TYPE "ExecutionTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'API', 'RETRY');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogLevel') THEN
    CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "Agent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "AgentStatus" NOT NULL DEFAULT 'DRAFT',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Workflow" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduleCron" TEXT,
  "definition" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Execution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "workflowId" TEXT,
  "requestedById" TEXT,
  "status" "ExecutionStatus" NOT NULL DEFAULT 'QUEUED',
  "trigger" "ExecutionTrigger" NOT NULL DEFAULT 'MANUAL',
  "inputPayload" JSONB,
  "outputPayload" JSONB,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExecutionLog" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "level" "LogLevel" NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Agent"
  ADD CONSTRAINT "Agent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Agent"
  ADD CONSTRAINT "Agent_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Workflow"
  ADD CONSTRAINT "Workflow_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workflow"
  ADD CONSTRAINT "Workflow_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workflow"
  ADD CONSTRAINT "Workflow_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Execution"
  ADD CONSTRAINT "Execution_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Execution"
  ADD CONSTRAINT "Execution_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Execution"
  ADD CONSTRAINT "Execution_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Execution"
  ADD CONSTRAINT "Execution_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExecutionLog"
  ADD CONSTRAINT "ExecutionLog_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExecutionLog"
  ADD CONSTRAINT "ExecutionLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Agent_organizationId_name_key" ON "Agent"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "Agent_organizationId_status_idx" ON "Agent"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Agent_organizationId_createdAt_idx" ON "Agent"("organizationId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Workflow_organizationId_agentId_name_key" ON "Workflow"("organizationId", "agentId", "name");
CREATE INDEX IF NOT EXISTS "Workflow_organizationId_status_idx" ON "Workflow"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Workflow_organizationId_agentId_createdAt_idx" ON "Workflow"("organizationId", "agentId", "createdAt");

CREATE INDEX IF NOT EXISTS "Execution_organizationId_status_createdAt_idx" ON "Execution"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Execution_organizationId_agentId_createdAt_idx" ON "Execution"("organizationId", "agentId", "createdAt");
CREATE INDEX IF NOT EXISTS "Execution_workflowId_createdAt_idx" ON "Execution"("workflowId", "createdAt");

CREATE INDEX IF NOT EXISTS "ExecutionLog_executionId_occurredAt_idx" ON "ExecutionLog"("executionId", "occurredAt");
CREATE INDEX IF NOT EXISTS "ExecutionLog_organizationId_occurredAt_idx" ON "ExecutionLog"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "ExecutionLog_organizationId_level_occurredAt_idx" ON "ExecutionLog"("organizationId", "level", "occurredAt");
