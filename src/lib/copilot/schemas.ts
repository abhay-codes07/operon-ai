import { z } from "zod";

export const copilotInterveneSchema = z.object({
  sessionId: z.string().trim().min(1),
  runId: z.string().trim().min(1),
  stepId: z.string().trim().min(1),
  agentConfidence: z.number().min(0).max(1),
  agentSuggestedAction: z.string().trim().min(1).max(500),
  humanAction: z.string().trim().min(1).max(500),
  interventionType: z.enum(["CONFIRM", "OVERRIDE_CLICK", "OVERRIDE_INPUT"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const copilotConfirmSchema = z.object({
  sessionId: z.string().trim().min(1),
  runId: z.string().trim().min(1),
  stepId: z.string().trim().min(1),
  action: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1),
});
