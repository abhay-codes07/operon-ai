-- Add deterministic workflow fingerprint to AutopilotSession
ALTER TABLE "AutopilotSession"
  ADD COLUMN IF NOT EXISTS "workflowFingerprint" TEXT;

CREATE INDEX IF NOT EXISTS "AutopilotSession_workflowFingerprint_idx"
  ON "AutopilotSession"("workflowFingerprint");
