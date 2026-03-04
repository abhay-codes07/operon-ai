export type ToolListItem = {
  id: string;
  organizationId: string;
  createdByAgentId?: string | null;
  name: string;
  description: string;
  usageCount: number;
  reliabilityScore: number;
  currentVersionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ToolVersionItem = {
  id: string;
  organizationId: string;
  toolId: string;
  versionNumber: number;
  workflowSteps: Array<Record<string, unknown>>;
  validationScore: number;
  validated: boolean;
  notes?: string | null;
  createdAt: Date;
};

export type ToolExecutionItem = {
  id: string;
  organizationId: string;
  toolId: string;
  toolVersionId: string;
  executionId?: string | null;
  status: "SUCCEEDED" | "FAILED";
  durationMs: number;
  output?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt: Date;
};
