export type LogSeverity = "DEBUG" | "INFO" | "WARN" | "ERROR";

export type StructuredLogContext = {
  component: string;
  executionId?: string;
  workflowId?: string;
  organizationId?: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
};

function toPayload(severity: LogSeverity, message: string, context: StructuredLogContext) {
  return {
    timestamp: new Date().toISOString(),
    severity,
    message,
    component: context.component,
    executionId: context.executionId,
    workflowId: context.workflowId,
    organizationId: context.organizationId,
    traceId: context.traceId,
    metadata: context.metadata,
  };
}

export function logStructured(severity: LogSeverity, message: string, context: StructuredLogContext): void {
  const payload = toPayload(severity, message, context);

  if (severity === "ERROR") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (severity === "WARN") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

export function logInfo(message: string, context: StructuredLogContext): void {
  logStructured("INFO", message, context);
}

export function logWarn(message: string, context: StructuredLogContext): void {
  logStructured("WARN", message, context);
}

export function logError(message: string, context: StructuredLogContext): void {
  logStructured("ERROR", message, context);
}
