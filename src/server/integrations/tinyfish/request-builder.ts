import type { WorkflowDefinition } from "@/modules/workflows/contracts";

import type { TinyFishExecutionRequest } from "./types";

type BuildTinyFishExecutionRequestInput = {
  requestId: string;
  organizationId: string;
  agentId: string;
  workflowId: string;
  workflowName: string;
  definition: WorkflowDefinition;
  targetUrlOverride?: string;
  metadata?: Record<string, unknown>;
};

// Intent-based routing: keyword → best starting URL
type IntentRoute = { keywords: string[]; url: string; goalPrefix: string };

const INTENT_ROUTES: IntentRoute[] = [
  // Shopping / price — highest priority
  {
    keywords: ["price", "cost", "how much", "buy", "purchase", "shop", "cheap", "deal",
               "discount", "sale", "order", "cart", "checkout", "product", "item", "sell", "sold"],
    url: "https://www.google.com/shopping",
    goalPrefix: "Search Google Shopping then check Amazon, eBay, Walmart, BestBuy, and Target to compare prices and collect the best price from each site for",
  },
  // Job / career
  {
    keywords: ["job", "jobs", "career", "hiring", "recruit", "vacancy", "position",
               "resume", "cv", "apply", "application", "salary"],
    url: "https://www.linkedin.com/jobs",
    goalPrefix: "Go to LinkedIn Jobs and",
  },
  // Stock / finance
  {
    keywords: ["stock", "share", "market", "invest", "portfolio", "finance",
               "crypto", "bitcoin", "etf", "fund", "trading"],
    url: "https://finance.yahoo.com",
    goalPrefix: "Go to Yahoo Finance and",
  },
  // News
  {
    keywords: ["news", "latest", "breaking", "headline", "article", "current event"],
    url: "https://news.ycombinator.com",
    goalPrefix: "Go to Hacker News and",
  },
  // Weather
  {
    keywords: ["weather", "forecast", "temperature", "rain", "sunny", "climate"],
    url: "https://weather.com",
    goalPrefix: "Go to Weather.com and",
  },
  // Travel
  {
    keywords: ["flight", "hotel", "travel", "ticket", "trip", "vacation", "airline", "airport"],
    url: "https://www.google.com/travel",
    goalPrefix: "Go to Google Travel and",
  },
  // Real estate
  {
    keywords: ["house", "apartment", "rent", "lease", "property", "real estate", "home for sale"],
    url: "https://www.zillow.com",
    goalPrefix: "Go to Zillow and",
  },
];

// Explicit site name → URL mapping
const SITE_MAP: Record<string, string> = {
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
  reddit: "https://www.reddit.com",
  youtube: "https://www.youtube.com",
  netflix: "https://www.netflix.com",
  airbnb: "https://www.airbnb.com",
  doordash: "https://www.doordash.com",
  zillow: "https://www.zillow.com",
  yelp: "https://www.yelp.com",
  "hacker news": "https://news.ycombinator.com",
  hackernews: "https://news.ycombinator.com",
};

type UrlExtractionResult = { url: string; goalPrefix: string | null };

function extractUrlAndIntent(definition: WorkflowDefinition): UrlExtractionResult {
  // Priority 1: Explicit targetUrl field in definition
  const targetUrl = (definition as Record<string, unknown>)?.targetUrl as string | undefined;
  if (targetUrl && isValidUrl(targetUrl)) return { url: targetUrl, goalPrefix: null };

  const task = definition.naturalLanguageTask.toLowerCase();

  // Priority 2: URL embedded directly in task text
  const urlMatch = task.match(/https?:\/\/[^\s)>]+|www\.[^\s)>]+/i);
  if (urlMatch) {
    let url = urlMatch[0].replace(/[.,;]$/, "");
    if (!url.startsWith("http")) url = "https://" + url;
    if (isValidUrl(url)) return { url, goalPrefix: null };
  }

  // Priority 3: Explicit site name mentioned in task
  for (const [site, url] of Object.entries(SITE_MAP)) {
    if (task.includes(site)) return { url, goalPrefix: null };
  }

  // Priority 4: Intent-based keyword routing
  for (const route of INTENT_ROUTES) {
    for (const keyword of route.keywords) {
      if (task.includes(keyword)) return { url: route.url, goalPrefix: route.goalPrefix };
    }
  }

  // Priority 5: Generic search intent
  if (task.includes("search") || task.includes("find") || task.includes("look for") || task.includes("lookup")) {
    return { url: "https://www.google.com", goalPrefix: "Go to Google and search to" };
  }

  // Default: Google as universal starting point
  return { url: "https://www.google.com", goalPrefix: "Starting from Google," };
}

// Builds a self-contained goal that includes where to navigate when not explicit
function buildGoal(naturalLanguageTask: string, goalPrefix: string | null): string {
  if (!goalPrefix) return naturalLanguageTask;
  const task = naturalLanguageTask.trim();
  const taskLower = task.toLowerCase();
  if (
    taskLower.startsWith("go to") || taskLower.startsWith("go and") || taskLower.startsWith("go ") ||
    taskLower.startsWith("navigate") || taskLower.startsWith("visit") ||
    taskLower.startsWith("open") || taskLower.startsWith("search") ||
    taskLower.startsWith("compare") || taskLower.startsWith("find the")
  ) {
    return task;
  }
  return `${goalPrefix} ${task.charAt(0).toLowerCase()}${task.slice(1)}`;
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
  // targetUrlOverride (e.g. from swarm inputPayload) takes highest priority
  const resolvedDefinition = input.targetUrlOverride
    ? { ...input.definition, targetUrl: input.targetUrlOverride }
    : input.definition;
  const { url, goalPrefix } = extractUrlAndIntent(resolvedDefinition as WorkflowDefinition);
  const goal = buildGoal(resolvedDefinition.naturalLanguageTask, goalPrefix);

  return {
    requestId: input.requestId,
    organizationId: input.organizationId,
    agentId: input.agentId,
    workflowId: input.workflowId,
    workflowName: input.workflowName,
    naturalLanguageTask: goal,
    url,
    goal,
    steps: resolvedDefinition.steps.map((step) => ({
      id: step.id,
      action: step.action,
      target: step.target,
      expectedOutcome: step.expectedOutcome,
    })),
    guardrails: resolvedDefinition.guardrails,
    timeoutSeconds: resolvedDefinition.timeoutSeconds,
    retryLimit: resolvedDefinition.retryLimit,
    metadata: input.metadata,
  };
}

