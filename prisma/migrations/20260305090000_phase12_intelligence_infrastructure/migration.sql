-- Phase 12 intelligence infrastructure models

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FailureCategory') THEN
    CREATE TYPE "FailureCategory" AS ENUM (
      'SELECTOR_DRIFT',
      'NAVIGATION_FAILURE',
      'AUTHENTICATION_ISSUE',
      'PAGE_LOAD_TIMEOUT',
      'UNKNOWN'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChangeType') THEN
    CREATE TYPE "ChangeType" AS ENUM ('ADDED', 'REMOVED', 'MODIFIED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChangeSeverity') THEN
    CREATE TYPE "ChangeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "AgentReliability" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "retryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "failureFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "avgExecutionMs" INTEGER NOT NULL DEFAULT 0,
  "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalExecutions" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentReliability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExecutionMetric" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "retriesUsed" INTEGER NOT NULL DEFAULT 0,
  "isSuccess" BOOLEAN NOT NULL DEFAULT false,
  "failureCategory" "FailureCategory",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutionMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FailureAnalysis" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "category" "FailureCategory" NOT NULL DEFAULT 'UNKNOWN',
  "summary" TEXT NOT NULL,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FailureAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DomainKnowledge" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "issueCount" INTEGER NOT NULL DEFAULT 0,
  "stabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DomainKnowledge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentInsight" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "domainKnowledgeId" TEXT,
  "insightType" TEXT NOT NULL,
  "insightKey" TEXT NOT NULL,
  "insightValue" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SharedSignal" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "domainKnowledgeId" TEXT,
  "signalType" TEXT NOT NULL,
  "signalKey" TEXT NOT NULL,
  "signalValue" JSONB NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SharedSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PageSnapshot" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "workflowId" TEXT,
  "url" TEXT NOT NULL,
  "domHash" TEXT NOT NULL,
  "snapshotRef" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChangeEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "workflowId" TEXT,
  "pageSnapshotId" TEXT NOT NULL,
  "changeType" "ChangeType" NOT NULL,
  "severity" "ChangeSeverity" NOT NULL DEFAULT 'MEDIUM',
  "previousHash" TEXT,
  "currentHash" TEXT NOT NULL,
  "details" JSONB,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChangeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SelectorHistory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "stepKey" TEXT NOT NULL,
  "originalSelector" TEXT NOT NULL,
  "alternativeSelector" TEXT NOT NULL,
  "failCount" INTEGER NOT NULL DEFAULT 1,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SelectorHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdaptiveWorkflow" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "adaptationVersion" INTEGER NOT NULL DEFAULT 1,
  "proposedDefinition" JSONB NOT NULL,
  "applied" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdaptiveWorkflow_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AgentReliability"
  ADD CONSTRAINT "AgentReliability_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentReliability"
  ADD CONSTRAINT "AgentReliability_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExecutionMetric"
  ADD CONSTRAINT "ExecutionMetric_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionMetric"
  ADD CONSTRAINT "ExecutionMetric_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionMetric"
  ADD CONSTRAINT "ExecutionMetric_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FailureAnalysis"
  ADD CONSTRAINT "FailureAnalysis_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FailureAnalysis"
  ADD CONSTRAINT "FailureAnalysis_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DomainKnowledge"
  ADD CONSTRAINT "DomainKnowledge_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentInsight"
  ADD CONSTRAINT "AgentInsight_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentInsight"
  ADD CONSTRAINT "AgentInsight_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentInsight"
  ADD CONSTRAINT "AgentInsight_domainKnowledgeId_fkey"
  FOREIGN KEY ("domainKnowledgeId") REFERENCES "DomainKnowledge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SharedSignal"
  ADD CONSTRAINT "SharedSignal_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SharedSignal"
  ADD CONSTRAINT "SharedSignal_domainKnowledgeId_fkey"
  FOREIGN KEY ("domainKnowledgeId") REFERENCES "DomainKnowledge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PageSnapshot"
  ADD CONSTRAINT "PageSnapshot_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageSnapshot"
  ADD CONSTRAINT "PageSnapshot_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageSnapshot"
  ADD CONSTRAINT "PageSnapshot_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChangeEvent"
  ADD CONSTRAINT "ChangeEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChangeEvent"
  ADD CONSTRAINT "ChangeEvent_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChangeEvent"
  ADD CONSTRAINT "ChangeEvent_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChangeEvent"
  ADD CONSTRAINT "ChangeEvent_pageSnapshotId_fkey"
  FOREIGN KEY ("pageSnapshotId") REFERENCES "PageSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SelectorHistory"
  ADD CONSTRAINT "SelectorHistory_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SelectorHistory"
  ADD CONSTRAINT "SelectorHistory_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdaptiveWorkflow"
  ADD CONSTRAINT "AdaptiveWorkflow_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdaptiveWorkflow"
  ADD CONSTRAINT "AdaptiveWorkflow_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "AgentReliability_agentId_key" ON "AgentReliability"("agentId");
CREATE INDEX IF NOT EXISTS "AgentReliability_organizationId_reliabilityScore_updatedAt_idx"
  ON "AgentReliability"("organizationId", "reliabilityScore", "updatedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ExecutionMetric_executionId_key" ON "ExecutionMetric"("executionId");
CREATE INDEX IF NOT EXISTS "ExecutionMetric_organizationId_agentId_createdAt_idx"
  ON "ExecutionMetric"("organizationId", "agentId", "createdAt");
CREATE INDEX IF NOT EXISTS "ExecutionMetric_organizationId_failureCategory_createdAt_idx"
  ON "ExecutionMetric"("organizationId", "failureCategory", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "FailureAnalysis_executionId_key" ON "FailureAnalysis"("executionId");
CREATE INDEX IF NOT EXISTS "FailureAnalysis_organizationId_category_updatedAt_idx"
  ON "FailureAnalysis"("organizationId", "category", "updatedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "DomainKnowledge_organizationId_domain_key"
  ON "DomainKnowledge"("organizationId", "domain");
CREATE INDEX IF NOT EXISTS "DomainKnowledge_organizationId_stabilityScore_lastSeenAt_idx"
  ON "DomainKnowledge"("organizationId", "stabilityScore", "lastSeenAt");

CREATE INDEX IF NOT EXISTS "AgentInsight_organizationId_agentId_updatedAt_idx"
  ON "AgentInsight"("organizationId", "agentId", "updatedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "SharedSignal_organizationId_signalType_signalKey_key"
  ON "SharedSignal"("organizationId", "signalType", "signalKey");
CREATE INDEX IF NOT EXISTS "SharedSignal_organizationId_lastSeenAt_idx"
  ON "SharedSignal"("organizationId", "lastSeenAt");

CREATE INDEX IF NOT EXISTS "PageSnapshot_organizationId_workflowId_capturedAt_idx"
  ON "PageSnapshot"("organizationId", "workflowId", "capturedAt");
CREATE INDEX IF NOT EXISTS "PageSnapshot_organizationId_url_capturedAt_idx"
  ON "PageSnapshot"("organizationId", "url", "capturedAt");

CREATE INDEX IF NOT EXISTS "ChangeEvent_organizationId_severity_detectedAt_idx"
  ON "ChangeEvent"("organizationId", "severity", "detectedAt");
CREATE INDEX IF NOT EXISTS "ChangeEvent_organizationId_workflowId_detectedAt_idx"
  ON "ChangeEvent"("organizationId", "workflowId", "detectedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "SelectorHistory_organizationId_workflowId_stepKey_originalSelector_alternativeSelector_key"
  ON "SelectorHistory"("organizationId", "workflowId", "stepKey", "originalSelector", "alternativeSelector");
CREATE INDEX IF NOT EXISTS "SelectorHistory_organizationId_workflowId_lastSeenAt_idx"
  ON "SelectorHistory"("organizationId", "workflowId", "lastSeenAt");

CREATE UNIQUE INDEX IF NOT EXISTS "AdaptiveWorkflow_workflowId_key" ON "AdaptiveWorkflow"("workflowId");
CREATE INDEX IF NOT EXISTS "AdaptiveWorkflow_organizationId_applied_updatedAt_idx"
  ON "AdaptiveWorkflow"("organizationId", "applied", "updatedAt");
