import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";

export async function streamCoPilotAction(input: {
  organizationId: string;
  executionId: string;
  stepId: string;
  confidence: number;
  action: string;
  target?: string;
}) {
  return publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "copilot.action",
    payload: {
      stepId: input.stepId,
      confidence: input.confidence,
      action: input.action,
      target: input.target ?? null,
    },
  });
}

export async function streamCoPilotIntervention(input: {
  organizationId: string;
  executionId: string;
  sessionId: string;
  stepId: string;
  humanAction: string;
}) {
  return publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "copilot.intervention",
    payload: {
      sessionId: input.sessionId,
      stepId: input.stepId,
      humanAction: input.humanAction,
    },
  });
}

export async function streamCoPilotHelpRequested(input: {
  organizationId: string;
  executionId: string;
  sessionId: string;
  stepId: string;
  reasons: string[];
}) {
  return publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "copilot.help_requested",
    payload: {
      sessionId: input.sessionId,
      stepId: input.stepId,
      reasons: input.reasons,
    },
  });
}
