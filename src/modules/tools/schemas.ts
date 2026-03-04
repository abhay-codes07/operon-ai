import { z } from "zod";

export const workflowStepSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1).optional(),
  expectedOutcome: z.string().min(1).optional(),
});

export const registerToolSchema = z.object({
  organizationId: z.string().cuid(),
  createdByAgentId: z.string().cuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(1000),
  workflowSteps: z.array(workflowStepSchema).min(1).max(200),
  notes: z.string().max(1000).optional(),
});

export const versionToolSchema = z.object({
  organizationId: z.string().cuid(),
  toolId: z.string().cuid(),
  workflowSteps: z.array(workflowStepSchema).min(1).max(200),
  notes: z.string().max(1000).optional(),
});

export const executeToolSchema = z.object({
  organizationId: z.string().cuid(),
  toolId: z.string().cuid(),
  toolVersionId: z.string().cuid(),
  executionId: z.string().cuid().optional(),
  status: z.enum(["SUCCEEDED", "FAILED"]),
  durationMs: z.number().int().min(0),
  output: z.record(z.string(), z.unknown()).optional(),
  errorMessage: z.string().max(5000).optional(),
});

export const installToolSchema = z.object({
  organizationId: z.string().cuid(),
  workflowId: z.string().cuid(),
  toolId: z.string().cuid(),
  toolVersionId: z.string().cuid(),
  installedById: z.string().cuid().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type RegisterToolInput = z.infer<typeof registerToolSchema>;
export type VersionToolInput = z.infer<typeof versionToolSchema>;
export type ExecuteToolInput = z.infer<typeof executeToolSchema>;
export type InstallToolInput = z.infer<typeof installToolSchema>;
