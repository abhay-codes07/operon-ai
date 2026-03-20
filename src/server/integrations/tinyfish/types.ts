export type TinyFishStepPayload = {
  id: string;
  action: string;
  target: string;
  expectedOutcome: string;
};

export type TinyFishExecutionRequest = {
  requestId: string;
  organizationId: string;
  agentId: string;
  workflowId: string;
  workflowName: string;
  naturalLanguageTask: string;
  url: string;
  goal: string;
  steps: TinyFishStepPayload[];
  guardrails: string[];
  timeoutSeconds: number;
  retryLimit: number;
  metadata?: Record<string, unknown>;
};

export type TinyFishExecutionStatus = "queued" | "running" | "succeeded" | "failed";

export type TinyFishExecutionEvent = {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type TinyFishScreenshot = {
  id: string;
  mimeType: string;
  base64Data: string;
  timestamp: string;
};

export type TinyFishExecutionResponse = {
  providerExecutionId: string;
  status: TinyFishExecutionStatus;
  summary?: string;
  output?: Record<string, unknown>;
  events: TinyFishExecutionEvent[];
  screenshots: TinyFishScreenshot[];
  error?: {
    code: string;
    message: string;
  };
};
