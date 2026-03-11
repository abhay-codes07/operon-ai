-- Operon Autopilot core models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutopilotSessionStatus') THEN
    CREATE TYPE "AutopilotSessionStatus" AS ENUM ('RECORDING', 'REVIEW', 'APPROVED', 'COMPLETED', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutopilotActionType') THEN
    CREATE TYPE "AutopilotActionType" AS ENUM ('NAVIGATE', 'CLICK', 'INPUT', 'EXTRACT', 'WAIT', 'CUSTOM');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AutopilotSession" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" "AutopilotSessionStatus" NOT NULL DEFAULT 'RECORDING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "compiledDefinition" JSONB,
  "parameterSchema" JSONB,
  "generatedWorkflowId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutopilotSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutopilotAction" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "actionType" "AutopilotActionType" NOT NULL,
  "selector" TEXT,
  "value" TEXT,
  "metadata" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutopilotAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DomainMemory" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "selectorPatterns" JSONB NOT NULL,
  "navigationPatterns" JSONB NOT NULL,
  "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DomainMemory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AutopilotSession"
  ADD CONSTRAINT "AutopilotSession_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutopilotSession"
  ADD CONSTRAINT "AutopilotSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutopilotAction"
  ADD CONSTRAINT "AutopilotAction_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AutopilotSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutopilotAction"
  ADD CONSTRAINT "AutopilotAction_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DomainMemory"
  ADD CONSTRAINT "DomainMemory_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AutopilotSession_orgId_status_startedAt_idx"
  ON "AutopilotSession"("orgId", "status", "startedAt");
CREATE INDEX IF NOT EXISTS "AutopilotSession_userId_startedAt_idx"
  ON "AutopilotSession"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "AutopilotAction_sessionId_timestamp_idx"
  ON "AutopilotAction"("sessionId", "timestamp");
CREATE INDEX IF NOT EXISTS "AutopilotAction_orgId_timestamp_idx"
  ON "AutopilotAction"("orgId", "timestamp");
CREATE UNIQUE INDEX IF NOT EXISTS "DomainMemory_orgId_domain_key"
  ON "DomainMemory"("orgId", "domain");
CREATE INDEX IF NOT EXISTS "DomainMemory_orgId_reliabilityScore_updatedAt_idx"
  ON "DomainMemory"("orgId", "reliabilityScore", "updatedAt");
