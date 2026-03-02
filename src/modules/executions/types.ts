export type ExecutionStatus = "queued" | "running" | "completed" | "failed";

export type ExecutionRecord = {
  id: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: Date;
  endedAt?: Date;
};
