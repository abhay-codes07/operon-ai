import { z } from "zod";

export const organizationPolicySchema = z.object({
  domainAllowlist: z.array(z.string().min(1)).max(100).default([]),
  restrictedActions: z.array(z.string().min(1)).max(100).default([]),
  allowedWindowStartHr: z.number().int().min(0).max(23).optional(),
  allowedWindowEndHr: z.number().int().min(0).max(23).optional(),
  timezone: z.string().min(2).max(80).default("UTC"),
  requireHttps: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type OrganizationPolicy = z.infer<typeof organizationPolicySchema>;
