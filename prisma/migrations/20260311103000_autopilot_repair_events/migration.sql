-- Autopilot repair event telemetry
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutopilotRepairStrategy') THEN
    CREATE TYPE "AutopilotRepairStrategy" AS ENUM ('SELECTOR_SIMILARITY', 'TEXT_MATCH', 'DOM_TRAVERSAL');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AutopilotRepairEvent" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "sessionId" TEXT,
  "workflowId" TEXT,
  "runId" TEXT,
  "domain" TEXT NOT NULL,
  "failedSelector" TEXT,
  "repairedSelector" TEXT,
  "strategy" "AutopilotRepairStrategy" NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutopilotRepairEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AutopilotRepairEvent"
  ADD CONSTRAINT "AutopilotRepairEvent_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutopilotRepairEvent"
  ADD CONSTRAINT "AutopilotRepairEvent_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AutopilotSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutopilotRepairEvent"
  ADD CONSTRAINT "AutopilotRepairEvent_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutopilotRepairEvent"
  ADD CONSTRAINT "AutopilotRepairEvent_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AutopilotRepairEvent_orgId_createdAt_idx"
  ON "AutopilotRepairEvent"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutopilotRepairEvent_sessionId_createdAt_idx"
  ON "AutopilotRepairEvent"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutopilotRepairEvent_workflowId_createdAt_idx"
  ON "AutopilotRepairEvent"("workflowId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutopilotRepairEvent_runId_createdAt_idx"
  ON "AutopilotRepairEvent"("runId", "createdAt");
