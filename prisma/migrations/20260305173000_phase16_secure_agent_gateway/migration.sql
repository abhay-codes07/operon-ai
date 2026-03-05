-- Phase 16 Operon Secure Agent Gateway

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PolicyRuleType') THEN
    CREATE TYPE "PolicyRuleType" AS ENUM ('DOMAIN_ALLOWLIST', 'ACTION_ALLOWLIST');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PolicyDecision') THEN
    CREATE TYPE "PolicyDecision" AS ENUM ('ALLOW', 'DENY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditResult') THEN
    CREATE TYPE "AuditResult" AS ENUM ('APPROVED', 'BLOCKED', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RiskLevel') THEN
    CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "AgentPolicy" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "maxRunsPerHour" INTEGER NOT NULL DEFAULT 120,
  "allowedWindowStartHr" INTEGER,
  "allowedWindowEndHr" INTEGER,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PolicyRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentPolicyId" TEXT NOT NULL,
  "ruleType" "PolicyRuleType" NOT NULL,
  "value" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExecutionAudit" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT,
  "agentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetDomain" TEXT,
  "intentHash" TEXT NOT NULL,
  "policyDecision" "PolicyDecision" NOT NULL,
  "result" "AuditResult" NOT NULL,
  "riskLevel" "RiskLevel" NOT NULL,
  "riskScore" INTEGER NOT NULL,
  "riskReason" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutionAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionAuditId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AgentPolicy"
  ADD CONSTRAINT "AgentPolicy_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentPolicy"
  ADD CONSTRAINT "AgentPolicy_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PolicyRule"
  ADD CONSTRAINT "PolicyRule_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyRule"
  ADD CONSTRAINT "PolicyRule_agentPolicyId_fkey"
  FOREIGN KEY ("agentPolicyId") REFERENCES "AgentPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExecutionAudit"
  ADD CONSTRAINT "ExecutionAudit_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionAudit"
  ADD CONSTRAINT "ExecutionAudit_executionId_fkey"
  FOREIGN KEY ("executionId") REFERENCES "Execution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExecutionAudit"
  ADD CONSTRAINT "ExecutionAudit_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent"
  ADD CONSTRAINT "AuditEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent"
  ADD CONSTRAINT "AuditEvent_executionAuditId_fkey"
  FOREIGN KEY ("executionAuditId") REFERENCES "ExecutionAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "AgentPolicy_organizationId_agentId_key"
  ON "AgentPolicy"("organizationId", "agentId");
CREATE INDEX IF NOT EXISTS "AgentPolicy_organizationId_enabled_updatedAt_idx"
  ON "AgentPolicy"("organizationId", "enabled", "updatedAt");

CREATE INDEX IF NOT EXISTS "PolicyRule_organizationId_ruleType_enabled_updatedAt_idx"
  ON "PolicyRule"("organizationId", "ruleType", "enabled", "updatedAt");
CREATE INDEX IF NOT EXISTS "PolicyRule_agentPolicyId_ruleType_enabled_idx"
  ON "PolicyRule"("agentPolicyId", "ruleType", "enabled");
CREATE UNIQUE INDEX IF NOT EXISTS "PolicyRule_agentPolicyId_ruleType_value_key"
  ON "PolicyRule"("agentPolicyId", "ruleType", "value");

CREATE INDEX IF NOT EXISTS "ExecutionAudit_organizationId_occurredAt_idx"
  ON "ExecutionAudit"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "ExecutionAudit_organizationId_agentId_occurredAt_idx"
  ON "ExecutionAudit"("organizationId", "agentId", "occurredAt");
CREATE INDEX IF NOT EXISTS "ExecutionAudit_organizationId_result_occurredAt_idx"
  ON "ExecutionAudit"("organizationId", "result", "occurredAt");

CREATE INDEX IF NOT EXISTS "AuditEvent_organizationId_occurredAt_idx"
  ON "AuditEvent"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_executionAuditId_occurredAt_idx"
  ON "AuditEvent"("executionAuditId", "occurredAt");
