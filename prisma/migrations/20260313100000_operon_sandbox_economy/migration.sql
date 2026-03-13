-- Operon Sandbox Economy core models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SandboxIdentityStatus') THEN
    CREATE TYPE "SandboxIdentityStatus" AS ENUM ('ACTIVE', 'REVOKED', 'COMPROMISED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SandboxIdentity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "fingerprintId" TEXT NOT NULL,
  "proxyId" TEXT NOT NULL,
  "status" "SandboxIdentityStatus" NOT NULL DEFAULT 'ACTIVE',
  "credentialVault" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "SandboxIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SandboxSession" (
  "id" TEXT NOT NULL,
  "identityId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "cookies" JSONB NOT NULL,
  "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SandboxSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BlastRadiusScore" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "factors" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlastRadiusScore_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "sandboxIdentityId" TEXT;

ALTER TABLE "SandboxIdentity"
  ADD CONSTRAINT "SandboxIdentity_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SandboxIdentity"
  ADD CONSTRAINT "SandboxIdentity_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SandboxSession"
  ADD CONSTRAINT "SandboxSession_identityId_fkey"
  FOREIGN KEY ("identityId") REFERENCES "SandboxIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SandboxSession"
  ADD CONSTRAINT "SandboxSession_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlastRadiusScore"
  ADD CONSTRAINT "BlastRadiusScore_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlastRadiusScore"
  ADD CONSTRAINT "BlastRadiusScore_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workflow"
  ADD CONSTRAINT "Workflow_sandboxIdentityId_fkey"
  FOREIGN KEY ("sandboxIdentityId") REFERENCES "SandboxIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "SandboxIdentity_workflowId_key" ON "SandboxIdentity"("workflowId");
CREATE UNIQUE INDEX IF NOT EXISTS "SandboxIdentity_email_key" ON "SandboxIdentity"("email");
CREATE INDEX IF NOT EXISTS "SandboxIdentity_organizationId_status_createdAt_idx" ON "SandboxIdentity"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "SandboxSession_identityId_lastActivity_idx" ON "SandboxSession"("identityId", "lastActivity");
CREATE INDEX IF NOT EXISTS "SandboxSession_organizationId_domain_lastActivity_idx" ON "SandboxSession"("organizationId", "domain", "lastActivity");
CREATE INDEX IF NOT EXISTS "BlastRadiusScore_workflowId_createdAt_idx" ON "BlastRadiusScore"("workflowId", "createdAt");
CREATE INDEX IF NOT EXISTS "BlastRadiusScore_organizationId_createdAt_idx" ON "BlastRadiusScore"("organizationId", "createdAt");
