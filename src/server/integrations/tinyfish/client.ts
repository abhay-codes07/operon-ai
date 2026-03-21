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
    logInfo("Dispatching TinyFish execution request", {
      component: "tinyfish-client",
      executionId: request.requestId,
      workflowId: request.workflowId,
      organizationId: request.organizationId,
      metadata: {
        stepCount: request.steps.length,
        url: request.url,
        goal: request.goal,
      },
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

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      console.error("[TinyFish API Error]", {
        status: response.status,
        statusText: response.statusText,
        payload,
        requestId: request.requestId,
      });
      throw new TinyFishApiError(
        `TinyFish request failed with status ${response.status}`,
        response.status,
        payload,
      );
    }

    const responseStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    console.log("[TinyFish Response]", {
      executionId: request.requestId,
      responseLength: responseStr.length,
      responseSample: responseStr.substring(0, 500),
    });

    logInfo("TinyFish execution request accepted", {
      component: "tinyfish-client",
      executionId: request.requestId,
      workflowId: request.workflowId,
      organizationId: request.organizationId,
    });

    // Normalize TinyFish API response to our internal format.
    // TinyFish uses different field names and status strings than our type contract.
    const raw = payload as Record<string, unknown>;
    const normalized: TinyFishExecutionResponse = {
      // TinyFish uses "run_id"; fall back to our requestId if absent
      providerExecutionId: (raw.run_id as string) ?? request.requestId,
      // Normalize status: TinyFish returns uppercase "COMPLETED"/"FAILED"
      status: normalizeTinyFishStatus(raw.status as string),
      // TinyFish uses "result" for output data
      output: (raw.result ?? raw.output) as Record<string, unknown> | undefined,
      summary: raw.summary as string | undefined,
      // TinyFish may not return events/screenshots; default to empty arrays
      events: (raw.events as TinyFishExecutionResponse["events"]) ?? [],
      screenshots: (raw.screenshots as TinyFishExecutionResponse["screenshots"]) ?? [],
      error: raw.error as TinyFishExecutionResponse["error"] | undefined,
    };

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
