import { evaluateStepRisk } from "@/lib/copilot/confidence.service";
import { getCoPilotSessionByRun, startCoPilotSession } from "@/lib/copilot/session.service";

export async function interceptExecutionStep(input: {
  organizationId: string;
  workflowId: string;
  runId: string;
  stepId: string;
  action: string;
  target?: string;
  expectedOutcome?: string;
  threshold?: number;
}) {
  const risk = evaluateStepRisk(
    {
      stepId: input.stepId,
      action: input.action,
      target: input.target,
      expectedOutcome: input.expectedOutcome,
    },
    input.threshold,
  );

  if (!risk.requiresHumanIntervention) {
    return {
      ...risk,
      sessionId: null,
      state: "agent_continues" as const,
    };
  }

  const activeSession = await getCoPilotSessionByRun(input.runId);
  const session =
    activeSession ??
    (await startCoPilotSession({
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      runId: input.runId,
    }));

  return {
    ...risk,
    sessionId: session.id,
    state: "human_required" as const,
  };
}
