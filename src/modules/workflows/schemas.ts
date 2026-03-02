import { z } from "zod";

export const createWorkflowInputSchema = z.object({
  organizationId: z.string().cuid(),
  agentId: z.string().cuid(),
  createdById: z.string().cuid(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  scheduleCron: z.string().max(100).optional(),
  definition: z.record(z.unknown()),
});

export const updateWorkflowStatusSchema = z.object({
  organizationId: z.string().cuid(),
  workflowId: z.string().cuid(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowInputSchema>;
export type UpdateWorkflowStatusInput = z.infer<typeof updateWorkflowStatusSchema>;
