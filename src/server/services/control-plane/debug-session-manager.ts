import {
  closeDebugSession,
  createDebugSession,
  listActiveDebugSessions,
  updateDebugSessionPatch,
} from "@/server/repositories/control-plane/debug-session-repository";
import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";

export async function startDebugSession(input: {
  organizationId: string;
  executionId: string;
  userId?: string;
  notes?: string;
}) {
  const session = await createDebugSession(input);

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "debug.session.started",
    payload: {
      debugSessionId: session.id,
      userId: input.userId ?? null,
    },
  });

  return session;
}

export async function applySelectorCorrection(input: {
  organizationId: string;
  executionId: string;
  debugSessionId: string;
  selectorPatch: Record<string, unknown>;
}) {
  const session = await updateDebugSessionPatch({
    debugSessionId: input.debugSessionId,
    selectorPatch: input.selectorPatch,
  });

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "debug.selector.patch",
    payload: {
      debugSessionId: input.debugSessionId,
      selectorPatch: input.selectorPatch,
    },
  });

  return session;
}

export async function stopDebugSession(input: {
  organizationId: string;
  executionId: string;
  debugSessionId: string;
}) {
  const session = await closeDebugSession(input.debugSessionId);

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "debug.session.stopped",
    payload: {
      debugSessionId: input.debugSessionId,
    },
  });

  return session;
}

export async function fetchActiveDebugSessions(input: { organizationId: string; executionId?: string }) {
  return listActiveDebugSessions(input);
}
