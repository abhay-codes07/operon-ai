import type { ExecutionStatus, LogLevel } from "@prisma/client";

import type { TinyFishExecutionResponse } from "./types";

type ParsedTinyFishResult = {
  status: ExecutionStatus;
  providerExecutionId: string;
  summary?: string;
  output?: Record<string, unknown>;
  errorMessage?: string;
  logs: Array<{
    level: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
  }>;
  screenshots: TinyFishExecutionResponse["screenshots"];
};

function mapExecutionStatus(status: TinyFishExecutionResponse["status"]): ExecutionStatus {
  switch (status) {
    case "queued":
      return "QUEUED";
    case "running":
      return "RUNNING";
    case "succeeded":
      return "SUCCEEDED";
    case "failed":
      return "FAILED";
    default:
      return "FAILED";
  }
}

function mapLogLevel(level: "debug" | "info" | "warn" | "error"): LogLevel {
  switch (level) {
    case "debug":
      return "DEBUG";
    case "warn":
      return "WARN";
    case "error":
      return "ERROR";
    case "info":
    default:
      return "INFO";
  }
}

export function parseTinyFishExecutionResponse(
  response: TinyFishExecutionResponse,
): ParsedTinyFishResult {
  return {
    status: mapExecutionStatus(response.status),
    providerExecutionId: response.providerExecutionId,
    summary: response.summary,
    output: response.output,
    errorMessage: response.error?.message,
    logs: response.events.map((event) => ({
      level: mapLogLevel(event.level),
      message: event.message,
      metadata: {
        timestamp: event.timestamp,
        ...event.metadata,
      },
    })),
    screenshots: response.screenshots,
  };
}
