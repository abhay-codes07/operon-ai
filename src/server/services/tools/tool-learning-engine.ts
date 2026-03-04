import {
  fetchToolVersions,
  recordToolExecution,
  versionTool,
} from "@/server/services/tools/tool-registry-service";

type ToolLearningSignal = {
  toolId: string;
  organizationId: string;
  status: "SUCCEEDED" | "FAILED";
  durationMs: number;
  executionId?: string;
  errorMessage?: string;
};

function optimizeSteps(
  workflowSteps: Array<{ id: string; action: string; target?: string; expectedOutcome?: string }>,
  errorMessage?: string,
) {
  if (!errorMessage) {
    return workflowSteps;
  }

  return workflowSteps.map((step) => {
    if (!step.target || !errorMessage.toLowerCase().includes("selector")) {
      return step;
    }

    return {
      ...step,
      target: step.target.startsWith("[data-testid=") ? step.target : `[data-testid='${step.id}']`,
      expectedOutcome: step.expectedOutcome ?? "Optimized by learning engine",
    };
  });
}

export async function learnFromToolExecution(signal: ToolLearningSignal) {
  const versions = await fetchToolVersions({
    organizationId: signal.organizationId,
    toolId: signal.toolId,
  });

  const currentVersion = versions[0];
  if (!currentVersion) {
    throw new Error("No tool version available for learning");
  }

  await recordToolExecution({
    organizationId: signal.organizationId,
    toolId: signal.toolId,
    toolVersionId: currentVersion.id,
    executionId: signal.executionId,
    status: signal.status,
    durationMs: signal.durationMs,
    errorMessage: signal.errorMessage,
  });

  if (signal.status === "FAILED") {
    await versionTool({
      organizationId: signal.organizationId,
      toolId: signal.toolId,
      workflowSteps: optimizeSteps(
        currentVersion.workflowSteps as Array<{
          id: string;
          action: string;
          target?: string;
          expectedOutcome?: string;
        }>,
        signal.errorMessage,
      ),
      notes: "Auto-optimized by ToolLearningEngine",
    });
  }
}
