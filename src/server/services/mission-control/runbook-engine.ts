import {
  createRunbook,
  createRunbookExecution,
  listRunbookExecutions,
  listRunbooks,
  updateRunbookExecution,
} from "@/server/repositories/mission-control/runbook-repository";
import { appendExecutionEvent } from "@/server/services/executions/execution-service";
import { recordAgentFleetStatus } from "@/server/services/mission-control/fleet-service";

type RunbookStep = {
  action: "retry_login" | "refresh_session" | "fallback_selector" | "notify_user";
  config?: Record<string, unknown>;
};

async function applyRunbookAction(input: {
  organizationId: string;
  step: RunbookStep;
  executionId?: string;
  agentId?: string;
}) {
  switch (input.step.action) {
    case "retry_login":
      if (input.executionId) {
        await appendExecutionEvent({
          organizationId: input.organizationId,
          executionId: input.executionId,
          level: "WARN",
          message: "Mission Control runbook requested login retry",
          metadata: input.step.config,
        });
      }
      break;
    case "refresh_session":
      if (input.executionId) {
        await appendExecutionEvent({
          organizationId: input.organizationId,
          executionId: input.executionId,
          level: "INFO",
          message: "Mission Control runbook requested session refresh",
          metadata: input.step.config,
        });
      }
      break;
    case "fallback_selector":
      if (input.executionId) {
        await appendExecutionEvent({
          organizationId: input.organizationId,
          executionId: input.executionId,
          level: "WARN",
          message: "Mission Control runbook switched to fallback selector strategy",
          metadata: input.step.config,
        });
      }
      break;
    case "notify_user":
      if (input.executionId) {
        await appendExecutionEvent({
          organizationId: input.organizationId,
          executionId: input.executionId,
          level: "INFO",
          message: "Mission Control runbook queued operator notification",
          metadata: input.step.config,
        });
      }
      break;
    default:
      break;
  }

  if (input.agentId) {
    await recordAgentFleetStatus({
      organizationId: input.organizationId,
      agentId: input.agentId,
      status: "RETRYING",
      reason: `Runbook action: ${input.step.action}`,
    });
  }
}

export async function createRecoveryRunbook(input: {
  organizationId: string;
  name: string;
  description: string;
  triggerType: string;
  steps: RunbookStep[];
}) {
  return createRunbook({
    organizationId: input.organizationId,
    name: input.name,
    description: input.description,
    triggerType: input.triggerType,
    steps: input.steps,
  });
}

export async function executeRunbooksForIncident(input: {
  organizationId: string;
  triggerType: string;
  incidentId: string;
  executionId?: string;
  agentId?: string;
}) {
  const runbooks = await listRunbooks({
    organizationId: input.organizationId,
    enabledOnly: true,
  });
  const matching = runbooks.filter((item) => item.triggerType === input.triggerType);

  const executions = [] as Array<{ runbookExecutionId: string; runbookId: string; status: "SUCCEEDED" | "FAILED" }>;
  for (const runbook of matching) {
    const runbookExecution = await createRunbookExecution({
      organizationId: input.organizationId,
      runbookId: runbook.id,
      triggerSource: `incident:${input.incidentId}`,
      executionId: input.executionId,
      agentId: input.agentId,
      status: "RUNNING",
    });
    const startedAt = new Date();
    const logs = [] as Array<{ level: "INFO" | "WARN" | "ERROR"; message: string; at: string }>;

    try {
      const steps = (runbook.steps as unknown as RunbookStep[]) ?? [];
      for (const step of steps) {
        await applyRunbookAction({
          organizationId: input.organizationId,
          step,
          executionId: input.executionId,
          agentId: input.agentId,
        });
        logs.push({
          level: "INFO",
          message: `Executed runbook action ${step.action}`,
          at: new Date().toISOString(),
        });
      }

      await updateRunbookExecution({
        organizationId: input.organizationId,
        runbookExecutionId: runbookExecution.id,
        status: "SUCCEEDED",
        logs,
        startedAt,
        finishedAt: new Date(),
      });
      executions.push({ runbookExecutionId: runbookExecution.id, runbookId: runbook.id, status: "SUCCEEDED" });
    } catch (error) {
      logs.push({
        level: "ERROR",
        message: error instanceof Error ? error.message : "Unknown runbook execution error",
        at: new Date().toISOString(),
      });
      await updateRunbookExecution({
        organizationId: input.organizationId,
        runbookExecutionId: runbookExecution.id,
        status: "FAILED",
        logs,
        startedAt,
        finishedAt: new Date(),
      });
      executions.push({ runbookExecutionId: runbookExecution.id, runbookId: runbook.id, status: "FAILED" });
    }
  }

  return executions;
}

export async function fetchRunbookExecutionHistory(organizationId: string) {
  return listRunbookExecutions({
    organizationId,
    limit: 30,
  });
}

export async function ensureMissionControlRunbooks(organizationId: string) {
  const runbooks = await listRunbooks({
    organizationId,
  });

  const defaults: Array<{
    name: string;
    description: string;
    triggerType: string;
    steps: RunbookStep[];
  }> = [
    {
      name: "Selector Recovery",
      description: "Fallback selector and session refresh for repeated selector drift.",
      triggerType: "SELECTOR_ERROR_LOOP",
      steps: [{ action: "fallback_selector" }, { action: "refresh_session" }],
    },
    {
      name: "Retry Stabilization",
      description: "Refresh state and notify operators during retry loops.",
      triggerType: "RETRY_LOOP",
      steps: [{ action: "refresh_session" }, { action: "notify_user" }],
    },
    {
      name: "Failure Spike Mitigation",
      description: "Retry authentication sequence and notify response owner.",
      triggerType: "FAILURE_SPIKE",
      steps: [{ action: "retry_login" }, { action: "notify_user" }],
    },
  ];

  for (const item of defaults) {
    if (!runbooks.some((runbook) => runbook.name === item.name)) {
      await createRunbook({
        organizationId,
        name: item.name,
        description: item.description,
        triggerType: item.triggerType,
        steps: item.steps,
      });
    }
  }
}
