import type { WorkflowDefinition } from "@/modules/workflows/contracts";

import type { TinyFishExecutionRequest } from "./types";

type BuildTinyFishExecutionRequestInput = {
  requestId: string;
  organizationId: string;
  agentId: string;
  workflowId: string;
  workflowName: string;
  definition: WorkflowDefinition;
  metadata?: Record<string, unknown>;
};

// Extract URL from task description or use targetUrl
function extractUrlFromTask(
  definition: WorkflowDefinition,
): string {
  // First check if targetUrl exists in definition (old format)
  const targetUrl = (definition as Record<string, unknown>)?.targetUrl as string | undefined;
  if (targetUrl && isValidUrl(targetUrl)) {
    return targetUrl;
  }

  // Extract domain from natural language task
  const task = definition.naturalLanguageTask.toLowerCase();
  
  // Common website patterns
  const websiteMap: Record<string, string> = {
    amazon: "https://www.amazon.com",
    ebay: "https://www.ebay.com",
    google: "https://www.google.com",
    github: "https://github.com",
    linkedin: "https://www.linkedin.com",
    twitter: "https://twitter.com",
    "x.com": "https://x.com",
    facebook: "https://www.facebook.com",
    instagram: "https://www.instagram.com",
    stripe: "https://stripe.com",
    shopify: "https://shopify.com",
    walmart: "https://www.walmart.com",
    target: "https://www.target.com",
    bestbuy: "https://www.bestbuy.com",
  };

  // Look for website mentions
  for (const [site, url] of Object.entries(websiteMap)) {
    if (task.includes(site)) {
      return url;
    }
  }

  // Look for URLs in the task
  const urlMatch = task.match(
    /https?:\/\/[^\s)]+|www\.[^\s)]+/i,
  );
  if (urlMatch) {
    let url = urlMatch[0];
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }
    if (isValidUrl(url)) {
      return url;
    }
  }

  // For generic multi-site tasks (like "visit popular websites"), use a generic URL
  // This allows the AI agent to intelligently choose where to go based on the task
  if (task.includes("website") || task.includes("browse") || task.includes("visit")) {
    // Use example.com as a base for the agent to start from and navigate
    // The agent will intelligently determine target sites based on the task
    return "https://www.example.com";
  }

  // For tasks with extraction keywords, use Google as the starting point
  if (task.includes("search") || task.includes("find") || task.includes("look for")) {
    return "https://www.google.com";
  }

  // Default fallback for any other generic tasks
  return "https://www.example.com";
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function buildTinyFishExecutionRequest(
  input: BuildTinyFishExecutionRequestInput,
): TinyFishExecutionRequest {
  const url = extractUrlFromTask(input.definition);
  
  return {
    requestId: input.requestId,
    organizationId: input.organizationId,
    agentId: input.agentId,
    workflowId: input.workflowId,
    workflowName: input.workflowName,
    naturalLanguageTask: input.definition.naturalLanguageTask,
    url,
    goal: input.definition.naturalLanguageTask,
    steps: input.definition.steps.map((step) => ({
      id: step.id,
      action: step.action,
      target: step.target,
      expectedOutcome: step.expectedOutcome,
    })),
    guardrails: input.definition.guardrails,
    timeoutSeconds: input.definition.timeoutSeconds,
    retryLimit: input.definition.retryLimit,
    metadata: input.metadata,
  };
}

