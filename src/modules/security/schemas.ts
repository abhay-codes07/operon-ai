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

export const secureAgentPolicySchema = z.object({
  enabled: z.boolean().default(true),
  maxRunsPerHour: z.number().int().min(1).max(2000).default(120),
  allowedWindowStartHr: z.number().int().min(0).max(23).optional(),
  allowedWindowEndHr: z.number().int().min(0).max(23).optional(),
  timezone: z.string().min(2).max(80).default("UTC"),
  domainAllowlist: z.array(z.string().min(1)).max(200).default([]),
  actionAllowlist: z.array(z.string().min(1)).max(200).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type SecureAgentPolicy = z.infer<typeof secureAgentPolicySchema>;
