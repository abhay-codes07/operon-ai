-- Operon Co-Pilot core tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CoPilotInterventionType') THEN
    CREATE TYPE "CoPilotInterventionType" AS ENUM ('CONFIRM', 'OVERRIDE_CLICK', 'OVERRIDE_INPUT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CoPilotSession" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "CoPilotSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CoPilotIntervention" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "interventionType" "CoPilotInterventionType" NOT NULL DEFAULT 'CONFIRM',
  "agentConfidence" DOUBLE PRECISION NOT NULL,
  "agentSuggestedAction" TEXT NOT NULL,
  "humanAction" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "CoPilotIntervention_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CoPilotSession"
  ADD CONSTRAINT "CoPilotSession_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoPilotSession"
  ADD CONSTRAINT "CoPilotSession_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoPilotSession"
  ADD CONSTRAINT "CoPilotSession_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoPilotIntervention"
  ADD CONSTRAINT "CoPilotIntervention_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoPilotIntervention"
  ADD CONSTRAINT "CoPilotIntervention_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "CoPilotSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CoPilotSession_organizationId_startedAt_idx"
  ON "CoPilotSession"("organizationId", "startedAt");
CREATE INDEX IF NOT EXISTS "CoPilotSession_workflowId_startedAt_idx"
  ON "CoPilotSession"("workflowId", "startedAt");
CREATE INDEX IF NOT EXISTS "CoPilotSession_runId_startedAt_idx"
  ON "CoPilotSession"("runId", "startedAt");
CREATE INDEX IF NOT EXISTS "CoPilotIntervention_organizationId_timestamp_idx"
  ON "CoPilotIntervention"("organizationId", "timestamp");
CREATE INDEX IF NOT EXISTS "CoPilotIntervention_sessionId_timestamp_idx"
  ON "CoPilotIntervention"("sessionId", "timestamp");
CREATE INDEX IF NOT EXISTS "CoPilotIntervention_stepId_timestamp_idx"
  ON "CoPilotIntervention"("stepId", "timestamp");
