import { z } from "zod";

export const createAgentInputSchema = z.object({
  organizationId: z.string().cuid(),
  createdById: z.string().cuid(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateAgentStatusInputSchema = z.object({
  organizationId: z.string().cuid(),
  agentId: z.string().cuid(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]),
});

export type CreateAgentInput = z.infer<typeof createAgentInputSchema>;
export type UpdateAgentStatusInput = z.infer<typeof updateAgentStatusInputSchema>;
