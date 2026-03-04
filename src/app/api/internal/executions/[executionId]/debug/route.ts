import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import {
  applySelectorCorrection,
  fetchActiveDebugSessions,
  startDebugSession,
  stopDebugSession,
} from "@/server/services/control-plane/debug-session-manager";

const startPayloadSchema = z.object({
  notes: z.string().max(500).optional(),
});

const patchPayloadSchema = z.object({
  debugSessionId: z.string().min(1),
  selectorPatch: z.record(z.string(), z.unknown()),
});

const closePayloadSchema = z.object({
  debugSessionId: z.string().min(1),
});

type RouteContext = {
  params: {
    executionId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const sessions = await fetchActiveDebugSessions({
    organizationId: user.organizationId!,
    executionId: context.params.executionId,
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, startPayloadSchema);
  if (error) {
    return error;
  }

  const session = await startDebugSession({
    organizationId: user.organizationId!,
    executionId: context.params.executionId,
    userId: user.id,
    notes: data.notes,
  });

  return NextResponse.json({ session }, { status: 201 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, patchPayloadSchema);
  if (error) {
    return error;
  }

  const session = await applySelectorCorrection({
    organizationId: user.organizationId!,
    executionId: context.params.executionId,
    debugSessionId: data.debugSessionId,
    selectorPatch: data.selectorPatch,
  });

  return NextResponse.json({ session });
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("ADMIN");
  const { data, error } = await parseJsonBody(request, closePayloadSchema);
  if (error) {
    return error;
  }

  const session = await stopDebugSession({
    organizationId: user.organizationId!,
    executionId: context.params.executionId,
    debugSessionId: data.debugSessionId,
  });

  return NextResponse.json({ session });
}
