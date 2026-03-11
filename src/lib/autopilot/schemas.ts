import { z } from "zod";

const domainSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .transform((value) => {
    try {
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return new URL(value).hostname;
      }
      return new URL(`https://${value}`).hostname;
    } catch {
      return value;
    }
  });

export const autopilotStartSchema = z.object({
  domain: domainSchema,
});

export const autopilotActionSchema = z.object({
  sessionId: z.string().trim().min(1),
  actionType: z.enum(["NAVIGATE", "CLICK", "INPUT", "EXTRACT", "WAIT", "CUSTOM"]),
  selector: z.string().trim().max(500).optional(),
  value: z.string().trim().max(4_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const autopilotFinishSchema = z.object({
  sessionId: z.string().trim().min(1),
  approve: z.boolean().optional(),
  name: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().max(500).optional(),
  editedDefinition: z
    .object({
      domain: z.string(),
      generatedAt: z.string(),
      steps: z.array(
        z.object({
          order: z.number().int().positive(),
          type: z.enum(["navigate", "click", "input", "extract", "wait", "custom"]),
          selector: z.string().optional(),
          value: z.string().optional(),
          url: z.string().optional(),
          parameterKey: z.string().optional(),
        }),
      ),
    })
    .optional(),
});

export const selectorRepairRequestSchema = z.object({
  domain: z.string().trim().min(1),
  failedSelector: z.string().trim().min(1),
  candidateSelectors: z.array(z.string().trim().min(1)).default([]),
});

export const autopilotListSessionsQuerySchema = z.object({
  status: z.enum(["RECORDING", "REVIEW", "APPROVED", "COMPLETED", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).max(200).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const autopilotListRepairEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(200).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  workflowId: z.string().trim().min(1).optional(),
  runId: z.string().trim().min(1).optional(),
});
