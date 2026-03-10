-- Operon Shield security models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShieldSeverity') THEN
    CREATE TYPE "ShieldSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PromptInjectionEvent" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "domLocation" TEXT,
  "injectedText" TEXT NOT NULL,
  "severity" "ShieldSeverity" NOT NULL DEFAULT 'MEDIUM',
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptInjectionEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShieldPolicy" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "allowedDomains" JSONB NOT NULL,
  "blockedActions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShieldPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentBehaviorBaseline" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "allowedActions" JSONB NOT NULL,
  "allowedDomains" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentBehaviorBaseline_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PromptInjectionEvent"
  ADD CONSTRAINT "PromptInjectionEvent_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptInjectionEvent"
  ADD CONSTRAINT "PromptInjectionEvent_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptInjectionEvent"
  ADD CONSTRAINT "PromptInjectionEvent_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShieldPolicy"
  ADD CONSTRAINT "ShieldPolicy_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentBehaviorBaseline"
  ADD CONSTRAINT "AgentBehaviorBaseline_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "AgentBehaviorBaseline_workflowId_key"
  ON "AgentBehaviorBaseline"("workflowId");

CREATE INDEX IF NOT EXISTS "PromptInjectionEvent_orgId_detectedAt_idx"
  ON "PromptInjectionEvent"("orgId", "detectedAt");
CREATE INDEX IF NOT EXISTS "PromptInjectionEvent_workflowId_detectedAt_idx"
  ON "PromptInjectionEvent"("workflowId", "detectedAt");
CREATE INDEX IF NOT EXISTS "PromptInjectionEvent_runId_detectedAt_idx"
  ON "PromptInjectionEvent"("runId", "detectedAt");
CREATE INDEX IF NOT EXISTS "PromptInjectionEvent_orgId_severity_detectedAt_idx"
  ON "PromptInjectionEvent"("orgId", "severity", "detectedAt");
CREATE INDEX IF NOT EXISTS "ShieldPolicy_orgId_createdAt_idx"
  ON "ShieldPolicy"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "AgentBehaviorBaseline_createdAt_idx"
  ON "AgentBehaviorBaseline"("createdAt");
