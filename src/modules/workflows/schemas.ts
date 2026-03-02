import { z } from "zod";

const cronSegment = "(\\*|\\d+|\\d+-\\d+|\\*/\\d+)";
const cronRegex = new RegExp(`^${cronSegment}(\\s+${cronSegment}){4}$`);

const workflowStepSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(2).max(120),
  target: z.string().min(2).max(240),
  expectedOutcome: z.string().min(2).max(240),
});

const workflowDefinitionSchema = z.object({
  naturalLanguageTask: z.string().min(10).max(1000),
  steps: z.array(workflowStepSchema).min(1).max(20),
  guardrails: z.array(z.string().min(2).max(120)).max(10),
  timeoutSeconds: z.number().int().min(30).max(3600),
  retryLimit: z.number().int().min(0).max(5),
});

export const createWorkflowInputSchema = z.object({
  organizationId: z.string().cuid(),
  agentId: z.string().cuid(),
  createdById: z.string().cuid(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  scheduleCron: z
    .string()
    .max(100)
    .regex(cronRegex, "Cron must have 5 fields")
    .optional(),
  definition: workflowDefinitionSchema,
});

export const updateWorkflowStatusSchema = z.object({
  organizationId: z.string().cuid(),
  workflowId: z.string().cuid(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]),
});

export const createWorkflowRequestSchema = z.object({
  agentId: z.string().cuid(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  scheduleCron: z
    .string()
    .max(100)
    .regex(cronRegex, "Cron must have 5 fields")
    .optional(),
  naturalLanguageTask: z.string().min(10).max(1000),
  guardrails: z.array(z.string().min(2).max(120)).default([]),
  timeoutSeconds: z.number().int().min(30).max(3600).default(300),
  retryLimit: z.number().int().min(0).max(5).default(1),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowInputSchema>;
export type UpdateWorkflowStatusInput = z.infer<typeof updateWorkflowStatusSchema>;
export type CreateWorkflowRequest = z.infer<typeof createWorkflowRequestSchema>;
