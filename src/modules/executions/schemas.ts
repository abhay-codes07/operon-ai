import { z } from "zod";

export const createExecutionInputSchema = z.object({
  organizationId: z.string().cuid(),
  agentId: z.string().cuid(),
  workflowId: z.string().cuid().optional(),
  requestedById: z.string().cuid().optional(),
  trigger: z.enum(["MANUAL", "SCHEDULED", "API", "RETRY"]).default("MANUAL"),
  inputPayload: z.record(z.unknown()).optional(),
});

export const appendExecutionLogInputSchema = z.object({
  organizationId: z.string().cuid(),
  executionId: z.string().cuid(),
  level: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).default("INFO"),
  message: z.string().min(1).max(5000),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateExecutionInput = z.infer<typeof createExecutionInputSchema>;
export type AppendExecutionLogInput = z.infer<typeof appendExecutionLogInputSchema>;
