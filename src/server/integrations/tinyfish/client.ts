import { getAppEnv } from "@/config/env";

import type { TinyFishExecutionRequest, TinyFishExecutionResponse } from "./types";

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
    const response = await fetch(`${config.baseUrl}${config.executePath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      throw new TinyFishApiError(
        `TinyFish request failed with status ${response.status}`,
        response.status,
        payload,
      );
    }

    return payload as TinyFishExecutionResponse;
  } finally {
    clearTimeout(timeoutHandle);
  }
}
