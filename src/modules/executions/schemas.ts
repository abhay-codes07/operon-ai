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

export const upsertExecutionStepsInputSchema = z.object({
  organizationId: z.string().cuid(),
  executionId: z.string().cuid(),
  steps: z.array(
    z.object({
      stepIndex: z.number().int().min(0),
      stepKey: z.string().min(1).max(120),
      action: z.string().min(1).max(120),
      target: z.string().min(1).max(240).optional(),
      status: z.enum(["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "SKIPPED"]).default("PENDING"),
      metadata: z.record(z.unknown()).optional(),
      startedAt: z.date().optional(),
      finishedAt: z.date().optional(),
    }),
  ),
});

export const createDomSnapshotInputSchema = z.object({
  organizationId: z.string().cuid(),
  executionId: z.string().cuid(),
  executionStepId: z.string().cuid().optional(),
  pageUrl: z.string().url().optional(),
  domHtml: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateExecutionInput = z.infer<typeof createExecutionInputSchema>;
export type AppendExecutionLogInput = z.infer<typeof appendExecutionLogInputSchema>;
export type UpsertExecutionStepsInput = z.infer<typeof upsertExecutionStepsInputSchema>;
export type CreateDomSnapshotInput = z.infer<typeof createDomSnapshotInputSchema>;
