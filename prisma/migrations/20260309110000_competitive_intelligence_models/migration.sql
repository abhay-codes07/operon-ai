-- Competitive Intelligence Nerve Center models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompetitorSignalType') THEN
    CREATE TYPE "CompetitorSignalType" AS ENUM (
      'PRICING_CHANGE',
      'FEATURE_CHANGE',
      'REVIEW_SENTIMENT',
      'JOB_POSTING',
      'HEADCOUNT_CHANGE'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Competitor" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "website" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompetitorSignal" (
  "id" TEXT NOT NULL,
  "competitorId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "signalType" "CompetitorSignalType" NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompetitorSignal_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Competitor"
  ADD CONSTRAINT "Competitor_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompetitorSignal"
  ADD CONSTRAINT "CompetitorSignal_competitorId_fkey"
  FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitorSignal"
  ADD CONSTRAINT "CompetitorSignal_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Competitor_orgId_name_key" ON "Competitor"("orgId", "name");
CREATE INDEX IF NOT EXISTS "Competitor_orgId_createdAt_idx" ON "Competitor"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "CompetitorSignal_competitorId_createdAt_idx" ON "CompetitorSignal"("competitorId", "createdAt");
CREATE INDEX IF NOT EXISTS "CompetitorSignal_orgId_signalType_createdAt_idx" ON "CompetitorSignal"("orgId", "signalType", "createdAt");
