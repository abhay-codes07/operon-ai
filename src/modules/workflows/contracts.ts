import type { WorkflowStatus } from "@prisma/client";

export type WorkflowStep = {
  id: string;
  action: string;
  target: string;
  expectedOutcome: string;
};

export type WorkflowDefinition = {
  naturalLanguageTask: string;
  steps: WorkflowStep[];
  guardrails: string[];
  timeoutSeconds: number;
  retryLimit: number;
};

export type WorkflowListItem = {
  id: string;
  organizationId: string;
  agentId: string;
  name: string;
  status: WorkflowStatus;
  description?: string | null;
  scheduleCron?: string | null;
  definition: WorkflowDefinition;
  createdAt: Date;
};
