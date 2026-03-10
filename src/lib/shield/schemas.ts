import { z } from "zod";

export const shieldPolicyPayloadSchema = z.object({
  allowedDomains: z.array(z.string().trim().min(1)).max(300).default([]),
  blockedActions: z.array(z.string().trim().min(1)).max(300).default([]),
});

export type ShieldPolicyPayload = z.infer<typeof shieldPolicyPayloadSchema>;

export const shieldEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  workflowId: z.string().trim().min(1).optional(),
  runId: z.string().trim().min(1).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export type ShieldEventsQuery = z.infer<typeof shieldEventsQuerySchema>;

export const shieldBaselinePayloadSchema = z.object({
  allowedActions: z.array(z.string().trim().min(1)).max(200).default([]),
  allowedDomains: z.array(z.string().trim().min(1)).max(200).default([]),
});

export type ShieldBaselinePayload = z.infer<typeof shieldBaselinePayloadSchema>;
