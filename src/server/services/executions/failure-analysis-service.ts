import {
  fetchExecutionFailureContext,
  getFailureAnalysis,
  upsertFailureAnalysis,
} from "@/server/repositories/executions/failure-analysis-repository";

type FailureCategory =
  | "SELECTOR_DRIFT"
  | "NAVIGATION_FAILURE"
  | "AUTHENTICATION_ISSUE"
  | "PAGE_LOAD_TIMEOUT"
  | "UNKNOWN";

function classifyFailure(input: {
  errorMessage?: string | null;
  logMessages: string[];
  steps: Array<{ action: string; target: string | null; status: string }>;
}) {
  const corpus = `${input.errorMessage ?? ""} ${input.logMessages.join(" ")}`.toLowerCase();

  if (corpus.includes("selector") || corpus.includes("element not found")) {
    return {
      category: "SELECTOR_DRIFT" as FailureCategory,
      summary: "Selector drift detected between workflow definition and live DOM.",
    };
  }

  if (corpus.includes("navigation") || corpus.includes("dns") || corpus.includes("not reachable")) {
    return {
      category: "NAVIGATION_FAILURE" as FailureCategory,
      summary: "Navigation failure detected before workflow completion.",
    };
  }

  if (corpus.includes("auth") || corpus.includes("unauthorized") || corpus.includes("login")) {
    return {
      category: "AUTHENTICATION_ISSUE" as FailureCategory,
      summary: "Authentication issue blocked workflow progression.",
    };
  }

  if (corpus.includes("timeout") || corpus.includes("timed out")) {
    return {
      category: "PAGE_LOAD_TIMEOUT" as FailureCategory,
      summary: "Page load timeout interrupted agent execution.",
    };
  }

  const failedStep = input.steps.find((step) => step.status === "FAILED");
  if (failedStep) {
    return {
      category: "UNKNOWN" as FailureCategory,
      summary: `Execution failed on ${failedStep.action} step. Manual inspection recommended.`,
    };
  }

  return {
    category: "UNKNOWN" as FailureCategory,
    summary: "Execution failed with an unclassified reason.",
  };
}

export async function analyzeExecutionFailure(input: { organizationId: string; executionId: string }) {
  const context = await fetchExecutionFailureContext(input);
  if (!context.execution || context.execution.status !== "FAILED") {
    return null;
  }

  const classification = classifyFailure({
    errorMessage: context.execution.errorMessage,
    logMessages: context.logs.map((item) => item.message),
    steps: context.steps.map((step) => ({
      action: step.action,
      target: step.target,
      status: step.status,
    })),
  });

  return upsertFailureAnalysis({
    organizationId: input.organizationId,
    executionId: input.executionId,
    category: classification.category,
    summary: classification.summary,
    evidence: {
      errorMessage: context.execution.errorMessage,
      failedStepCount: context.steps.filter((step) => step.status === "FAILED").length,
      sampledLogs: context.logs.slice(-10),
      domDiffInputs: context.snapshots.map((snapshot) => ({
        pageUrl: snapshot.pageUrl,
        domLength: snapshot.domHtml.length,
      })),
    },
  });
}

export async function fetchFailureAnalysis(input: { organizationId: string; executionId: string }) {
  return getFailureAnalysis(input);
}
