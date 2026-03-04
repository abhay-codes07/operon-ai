import { fetchExecutionReplay } from "@/server/services/executions/replay-service";
import { fetchFailureAnalysis } from "@/server/services/executions/failure-analysis-service";
import { fetchExecutionTimeline } from "@/server/services/executions/execution-service";
import { registerTool } from "@/server/services/tools/tool-registry-service";

function inferToolName(input: { category?: string; executionId: string }) {
  const suffix = input.executionId.slice(-6);
  switch (input.category) {
    case "SELECTOR_DRIFT":
      return `selector-healer-${suffix}`;
    case "NAVIGATION_FAILURE":
      return `navigation-recovery-${suffix}`;
    case "AUTHENTICATION_ISSUE":
      return `auth-recovery-${suffix}`;
    case "PAGE_LOAD_TIMEOUT":
      return `timeout-handler-${suffix}`;
    default:
      return `adaptive-tool-${suffix}`;
  }
}

export async function generateToolFromExecutionFailure(input: {
  organizationId: string;
  agentId?: string;
  executionId: string;
}) {
  const [analysis, replay, timeline] = await Promise.all([
    fetchFailureAnalysis({
      organizationId: input.organizationId,
      executionId: input.executionId,
    }),
    fetchExecutionReplay({
      organizationId: input.organizationId,
      executionId: input.executionId,
    }),
    fetchExecutionTimeline({
      organizationId: input.organizationId,
      executionId: input.executionId,
      page: 1,
      pageSize: 200,
    }),
  ]);

  const failedSteps = replay.steps.filter((step) => step.status === "FAILED");
  const generatedSteps = (failedSteps.length > 0 ? failedSteps : replay.steps).map((step) => ({
    id: step.stepKey,
    action: step.action,
    target: step.target ?? undefined,
    expectedOutcome:
      (step.metadata?.expectedOutcome as string | undefined) ??
      "Recover previously failed workflow action",
  }));

  const tool = await registerTool({
    organizationId: input.organizationId,
    createdByAgentId: input.agentId,
    name: inferToolName({
      category: analysis?.category,
      executionId: input.executionId,
    }),
    description:
      analysis?.summary ??
      `Generated from execution ${input.executionId} to automate repeated remediation.`,
    workflowSteps: generatedSteps,
    notes: `Generated from ${timeline.items.length} timeline events and ${replay.snapshots.length} snapshots.`,
  });

  return {
    tool,
    source: {
      analysisCategory: analysis?.category ?? "UNKNOWN",
      failedStepCount: failedSteps.length,
      snapshotCount: replay.snapshots.length,
    },
  };
}
