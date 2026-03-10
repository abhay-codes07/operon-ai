import { z } from "zod";

export const pipelineStepSchema = z.object({
  agentId: z.string().trim().min(1),
  stepOrder: z.number().int().min(1),
  inputMapping: z.record(z.string(), z.unknown()).default({}),
  outputMapping: z.record(z.string(), z.unknown()).default({}),
});

export const createPipelineSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional(),
  steps: z.array(pipelineStepSchema).min(1),
});

export const startPipelineSchema = z.object({
  input: z.record(z.string(), z.unknown()).optional().default({}),
});

export type PipelineStepInput = z.infer<typeof pipelineStepSchema>;
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type StartPipelineInput = z.infer<typeof startPipelineSchema>;
