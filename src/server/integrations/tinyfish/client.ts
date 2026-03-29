import { getAppEnv } from "@/config/env";
import { logInfo } from "@/server/observability/logger";

import type { TinyFishExecutionRequest, TinyFishExecutionResponse } from "./types";
import type { TinyFishExecutionStatus } from "./types";

// Normalize TinyFish status strings to our internal contract.
// TinyFish API returns uppercase ("COMPLETED", "FAILED") while our type uses lowercase.
function normalizeTinyFishStatus(raw: string | undefined): TinyFishExecutionStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "COMPLETED":
    case "SUCCEEDED":
    case "SUCCESS":
      return "succeeded";
    case "RUNNING":
    case "IN_PROGRESS":
      return "running";
    case "QUEUED":
    case "PENDING":
      return "queued";
    case "FAILED":
    case "ERROR":
    default:
      return "failed";
  }
}

type TinyFishClientConfig = {
  baseUrl: string;
  apiKey: string;
  executePath: string;
  timeoutMs: number;
};

export class TinyFishApiError extends Error {
  readonly statusCode: number;
  readonly payload: unknown;

  constructor(message: string, statusCode: number, payload: unknown) {
    super(message);
    this.name = "TinyFishApiError";
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

function getTinyFishClientConfig(): TinyFishClientConfig {
  const env = getAppEnv();

  return {
    baseUrl: env.TINYFISH_BASE_URL,
    apiKey: env.TINYFISH_API_KEY,
    executePath: env.TINYFISH_EXECUTE_PATH,
    timeoutMs: env.TINYFISH_TIMEOUT_MS,
  };
}

export async function executeTinyFishWorkflow(
  request: TinyFishExecutionRequest,
): Promise<TinyFishExecutionResponse> {
  const config = getTinyFishClientConfig();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const requestBody = JSON.stringify(request);
    logInfo("Dispatching TinyFish execution request", {
      component: "tinyfish-client",
      executionId: request.requestId,
      workflowId: request.workflowId,
      organizationId: request.organizationId,
      metadata: {
        stepCount: request.steps.length,
        url: request.url,
        goal: request.goal,
        endpoint: `${config.baseUrl}${config.executePath}`,
      },
    });
    console.log("[TinyFish Request]", {
      endpoint: `${config.baseUrl}${config.executePath}`,
      requestId: request.requestId,
      url: request.url,
      goal: request.goal,
      stepCount: request.steps.length,
      requestBodySample: requestBody.substring(0, 500),
    });

    const response = await fetch(`${config.baseUrl}${config.executePath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    // Read raw text first for debugging, then parse as JSON
    const rawText = await response.text().catch(() => "");

    console.log("[TinyFish Raw Response]", {
      executionId: request.requestId,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      rawBody: rawText.substring(0, 1000),
    });

    let payload: unknown = null;
    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch {
      // Not JSON — payload stays null
    }

    if (!response.ok) {
      console.error("[TinyFish API Error]", {
        status: response.status,
        statusText: response.statusText,
        rawBody: rawText.substring(0, 500),
        payload,
        requestId: request.requestId,
      });
      throw new TinyFishApiError(
        `TinyFish request failed with status ${response.status}: ${rawText.substring(0, 200)}`,
        response.status,
        payload,
      );
    }

    logInfo("TinyFish execution request accepted", {
      component: "tinyfish-client",
      executionId: request.requestId,
      workflowId: request.workflowId,
      organizationId: request.organizationId,
    });

    // Normalize TinyFish API response to our internal format.
    // TinyFish uses different field names and status strings than our type contract.
    // Guard against null/non-JSON response bodies.
    const raw = (payload != null && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
    const normalized: TinyFishExecutionResponse = {
      // TinyFish uses "run_id"; fall back to our requestId if absent
      providerExecutionId: (raw.run_id as string) ?? (raw.id as string) ?? request.requestId,
      // Normalize status: TinyFish returns uppercase "COMPLETED"/"FAILED"
      status: normalizeTinyFishStatus(raw.status as string),
      // TinyFish uses "result" for output data
      output: (raw.result ?? raw.output) as Record<string, unknown> | undefined,
      summary: (raw.summary ?? (rawText && !payload ? rawText.substring(0, 500) : undefined)) as string | undefined,
      // TinyFish may not return events/screenshots; default to empty arrays
      events: (raw.events as TinyFishExecutionResponse["events"]) ?? [],
      screenshots: (raw.screenshots as TinyFishExecutionResponse["screenshots"]) ?? [],
      error: raw.error as TinyFishExecutionResponse["error"] | undefined,
    };

    console.log("[TinyFish Normalized]", {
      executionId: request.requestId,
      providerExecutionId: normalized.providerExecutionId,
      status: normalized.status,
    });

    return normalized;
  } catch (error) {
    // Abort error typically means timeout or explicit abort
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[TinyFish Abort Error]", {
        executionId: request.requestId,
        message: error.message,
        timeoutMs: config.timeoutMs,
        url: request.url,
      });
      throw new Error(`TinyFish request aborted (timeout: ${config.timeoutMs}ms)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}
