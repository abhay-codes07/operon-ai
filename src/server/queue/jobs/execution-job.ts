export const executionJobName = "run-execution";

export type ExecutionJobData = {
  organizationId: string;
  executionId: string;
  agentId: string;
  workflowId: string;
  requestedById?: string;
  trigger: "MANUAL" | "SCHEDULED" | "API" | "RETRY";
};
