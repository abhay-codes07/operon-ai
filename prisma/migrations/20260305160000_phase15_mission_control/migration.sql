-- Phase 15 Operon Mission Control

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FleetStatus') THEN
    CREATE TYPE "FleetStatus" AS ENUM ('RUNNING', 'IDLE', 'FAILED', 'RETRYING');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HealthStatus') THEN
    CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'CRITICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentSeverity') THEN
    CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentStatus') THEN
    CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RunbookExecutionStatus') THEN
    CREATE TYPE "RunbookExecutionStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "AgentStatusSnapshot" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "status" "FleetStatus" NOT NULL,
  "reason" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "AgentStatusSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentHealth" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "status" "HealthStatus" NOT NULL,
  "cpuLoadPct" DOUBLE PRECISION,
  "memoryUsageMb" INTEGER,
  "queueBacklog" INTEGER,
  "successRateWindow" DOUBLE PRECISION,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentHealth_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Incident" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT,
  "executionId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
  "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "IncidentEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Runbook" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL,
  "steps" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Runbook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RunbookExecution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "runbookId" TEXT NOT NULL,
  "agentId" TEXT,
  "executionId" TEXT,
  "status" "RunbookExecutionStatus" NOT NULL DEFAULT 'QUEUED',
  "triggerSource" TEXT NOT NULL,
  "logs" JSONB,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RunbookExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentDeployment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "desiredRuns" INTEGER NOT NULL DEFAULT 1,
  "actualRuns" INTEGER NOT NULL DEFAULT 0,
  "status" "FleetStatus" NOT NULL DEFAULT 'IDLE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentDeployment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AgentStatusSnapshot"
  ADD CONSTRAINT "AgentStatusSnapshot_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentStatusSnapshot"
  ADD CONSTRAINT "AgentStatusSnapshot_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentHealth"
  ADD CONSTRAINT "AgentHealth_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentHealth"
  ADD CONSTRAINT "AgentHealth_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Incident"
  ADD CONSTRAINT "Incident_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Incident"
  ADD CONSTRAINT "Incident_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident"
  ADD CONSTRAINT "Incident_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IncidentEvent"
  ADD CONSTRAINT "IncidentEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncidentEvent"
  ADD CONSTRAINT "IncidentEvent_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Runbook"
  ADD CONSTRAINT "Runbook_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RunbookExecution"
  ADD CONSTRAINT "RunbookExecution_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunbookExecution"
  ADD CONSTRAINT "RunbookExecution_runbookId_fkey"
  FOREIGN KEY ("runbookId") REFERENCES "Runbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunbookExecution"
  ADD CONSTRAINT "RunbookExecution_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RunbookExecution"
  ADD CONSTRAINT "RunbookExecution_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentDeployment"
  ADD CONSTRAINT "AgentDeployment_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentDeployment"
  ADD CONSTRAINT "AgentDeployment_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AgentStatusSnapshot_organizationId_status_occurredAt_idx"
  ON "AgentStatusSnapshot"("organizationId", "status", "occurredAt");
CREATE INDEX IF NOT EXISTS "AgentStatusSnapshot_agentId_occurredAt_idx"
  ON "AgentStatusSnapshot"("agentId", "occurredAt");

CREATE INDEX IF NOT EXISTS "AgentHealth_organizationId_status_recordedAt_idx"
  ON "AgentHealth"("organizationId", "status", "recordedAt");
CREATE INDEX IF NOT EXISTS "AgentHealth_agentId_recordedAt_idx"
  ON "AgentHealth"("agentId", "recordedAt");

CREATE INDEX IF NOT EXISTS "Incident_organizationId_status_detectedAt_idx"
  ON "Incident"("organizationId", "status", "detectedAt");
CREATE INDEX IF NOT EXISTS "Incident_organizationId_severity_detectedAt_idx"
  ON "Incident"("organizationId", "severity", "detectedAt");
CREATE INDEX IF NOT EXISTS "IncidentEvent_organizationId_incidentId_occurredAt_idx"
  ON "IncidentEvent"("organizationId", "incidentId", "occurredAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Runbook_organizationId_name_key" ON "Runbook"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "Runbook_organizationId_enabled_updatedAt_idx"
  ON "Runbook"("organizationId", "enabled", "updatedAt");
CREATE INDEX IF NOT EXISTS "RunbookExecution_organizationId_status_createdAt_idx"
  ON "RunbookExecution"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "RunbookExecution_organizationId_runbookId_createdAt_idx"
  ON "RunbookExecution"("organizationId", "runbookId", "createdAt");

CREATE INDEX IF NOT EXISTS "AgentDeployment_organizationId_status_updatedAt_idx"
  ON "AgentDeployment"("organizationId", "status", "updatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AgentDeployment_organizationId_agentId_key"
  ON "AgentDeployment"("organizationId", "agentId");
