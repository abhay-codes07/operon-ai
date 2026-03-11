import { prisma } from "@/server/db/client";

type StartRecordingInput = {
  orgId: string;
  userId: string;
  domain: string;
};

type StoreActionInput = {
  sessionId: string;
  orgId: string;
  actionType: "NAVIGATE" | "CLICK" | "INPUT" | "EXTRACT" | "WAIT" | "CUSTOM";
  selector?: string;
  value?: string;
  metadata?: Record<string, unknown>;
};

export async function startRecording(input: StartRecordingInput) {
  return prisma.autopilotSession.create({
    data: {
      orgId: input.orgId,
      userId: input.userId,
      domain: input.domain,
      status: "RECORDING",
    },
  });
}

export async function storeAction(input: StoreActionInput) {
  return prisma.autopilotAction.create({
    data: {
      sessionId: input.sessionId,
      orgId: input.orgId,
      actionType: input.actionType,
      selector: input.selector,
      value: input.value,
      metadata: input.metadata,
    },
  });
}

export async function captureClick(input: {
  sessionId: string;
  orgId: string;
  selector: string;
  metadata?: Record<string, unknown>;
}) {
  return storeAction({
    sessionId: input.sessionId,
    orgId: input.orgId,
    actionType: "CLICK",
    selector: input.selector,
    metadata: input.metadata,
  });
}

export async function captureInput(input: {
  sessionId: string;
  orgId: string;
  selector: string;
  value: string;
  metadata?: Record<string, unknown>;
}) {
  return storeAction({
    sessionId: input.sessionId,
    orgId: input.orgId,
    actionType: "INPUT",
    selector: input.selector,
    value: input.value,
    metadata: input.metadata,
  });
}

export async function captureNavigation(input: {
  sessionId: string;
  orgId: string;
  url: string;
  metadata?: Record<string, unknown>;
}) {
  return storeAction({
    sessionId: input.sessionId,
    orgId: input.orgId,
    actionType: "NAVIGATE",
    value: input.url,
    metadata: {
      ...(input.metadata ?? {}),
      url: input.url,
    },
  });
}

export async function getSessionWithActions(sessionId: string, orgId: string) {
  return prisma.autopilotSession.findFirst({
    where: {
      id: sessionId,
      orgId,
    },
    include: {
      actions: {
        orderBy: { timestamp: "asc" },
      },
    },
  });
}

export async function setSessionReviewPayload(input: {
  sessionId: string;
  orgId: string;
  compiledDefinition: Record<string, unknown>;
  parameterSchema: Record<string, unknown>;
}) {
  return prisma.autopilotSession.updateMany({
    where: {
      id: input.sessionId,
      orgId: input.orgId,
    },
    data: {
      status: "REVIEW",
      compiledDefinition: input.compiledDefinition,
      parameterSchema: input.parameterSchema,
    },
  });
}

export async function completeSession(input: {
  sessionId: string;
  orgId: string;
  generatedWorkflowId?: string;
  failed?: boolean;
}) {
  return prisma.autopilotSession.updateMany({
    where: {
      id: input.sessionId,
      orgId: input.orgId,
    },
    data: {
      status: input.failed ? "FAILED" : "COMPLETED",
      completedAt: new Date(),
      generatedWorkflowId: input.generatedWorkflowId,
    },
  });
}

export async function updateSessionForReview(input: {
  sessionId: string;
  orgId: string;
  status?: "REVIEW" | "APPROVED";
  compiledDefinition?: Record<string, unknown>;
  parameterSchema?: Record<string, unknown>;
}) {
  return prisma.autopilotSession.updateMany({
    where: {
      id: input.sessionId,
      orgId: input.orgId,
    },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.compiledDefinition ? { compiledDefinition: input.compiledDefinition } : {}),
      ...(input.parameterSchema ? { parameterSchema: input.parameterSchema } : {}),
    },
  });
}
