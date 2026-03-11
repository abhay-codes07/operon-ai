import { compileWorkflowFromActions } from "@/lib/autopilot/workflow-compiler.service";
import { detectWorkflowParameters } from "@/lib/autopilot/parameterizer.service";
import {
  completeSession,
  getSessionWithActions,
  setSessionReviewPayload,
  startRecording,
  storeAction,
  updateSessionForReview,
} from "@/lib/autopilot/session-recorder.service";
import { updateMemoryFromRun } from "@/lib/autopilot/domain-memory.service";
import { createWorkflowFingerprint } from "@/lib/autopilot/fingerprint.service";
import { prisma } from "@/server/db/client";

export async function createAutopilotSession(input: {
  orgId: string;
  userId: string;
  domain: string;
}) {
  return startRecording(input);
}

export async function recordAutopilotAction(input: {
  orgId: string;
  sessionId: string;
  actionType: "NAVIGATE" | "CLICK" | "INPUT" | "EXTRACT" | "WAIT" | "CUSTOM";
  selector?: string;
  value?: string;
  metadata?: Record<string, unknown>;
}) {
  const session = await prisma.autopilotSession.findFirst({
    where: {
      id: input.sessionId,
      orgId: input.orgId,
      status: {
        in: ["RECORDING", "REVIEW"],
      },
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    return null;
  }

  return storeAction(input);
}

export async function finishAutopilotSession(input: {
  orgId: string;
  sessionId: string;
  approve?: boolean;
  name?: string;
  description?: string;
  editedDefinition?: Record<string, unknown>;
}) {
  const session = await getSessionWithActions(input.sessionId, input.orgId);
  if (!session) {
    return {
      ok: false as const,
      reason: "session_not_found",
    };
  }

  const compiled = compileWorkflowFromActions(session.domain, session.actions);
  const parameterized = detectWorkflowParameters(compiled);

  const reviewDefinition = input.editedDefinition ?? (parameterized.definition as unknown as Record<string, unknown>);
  const workflowFingerprint = createWorkflowFingerprint(reviewDefinition);

  await setSessionReviewPayload({
    sessionId: input.sessionId,
    orgId: input.orgId,
    compiledDefinition: reviewDefinition,
    parameterSchema: parameterized.schema as unknown as Record<string, unknown>,
    workflowFingerprint,
  });

  const selectors = parameterized.definition.steps
    .map((step) => step.selector)
    .filter((value): value is string => typeof value === "string");

  const urls = parameterized.definition.steps
    .map((step) => step.url)
    .filter((value): value is string => typeof value === "string");

  await updateMemoryFromRun({
    orgId: input.orgId,
    domain: session.domain,
    successfulSelectors: selectors,
    visitedUrls: urls,
    repaired: false,
  });

  let workflowId: string | undefined;
  if (!input.approve) {
    return {
      ok: true as const,
      compiled: reviewDefinition,
      parameterSchema: parameterized.schema,
      workflowFingerprint,
      generatedWorkflowId: null,
    };
  }

  await updateSessionForReview({
    orgId: input.orgId,
    sessionId: input.sessionId,
    status: "APPROVED",
  });

  const firstAgent = await prisma.agent.findFirst({
    where: {
      organizationId: input.orgId,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
    },
  });

  if (!firstAgent) {
    return {
      ok: false as const,
      reason: "no_agent_available",
      compiled: parameterized.definition,
      parameterSchema: parameterized.schema,
      workflowFingerprint,
    };
  }

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: input.orgId,
      agentId: firstAgent.id,
      createdById: session.userId,
      name: input.name?.trim() || `Autopilot ${session.domain}`,
      description: input.description?.trim() || "Generated from Operon Autopilot learn mode",
      status: "DRAFT",
      definition: reviewDefinition,
    },
    select: {
      id: true,
    },
  });

  workflowId = workflow.id;

  await completeSession({
    sessionId: input.sessionId,
    orgId: input.orgId,
    generatedWorkflowId: workflowId,
  });

  return {
    ok: true as const,
    compiled: reviewDefinition,
    parameterSchema: parameterized.schema,
    workflowFingerprint,
    generatedWorkflowId: workflowId ?? null,
  };
}

export async function getAutopilotSession(orgId: string, sessionId: string) {
  return getSessionWithActions(sessionId, orgId);
}

export async function patchAutopilotSession(input: {
  orgId: string;
  sessionId: string;
  status?: "REVIEW" | "APPROVED" | "FAILED";
  compiledDefinition?: Record<string, unknown>;
  parameterSchema?: Record<string, unknown>;
}) {
  const updated = await updateSessionForReview(input);
  return updated.count > 0;
}
