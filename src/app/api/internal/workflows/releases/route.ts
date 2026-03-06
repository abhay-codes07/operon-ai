import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { validateJson } from "@/server/api/validation";
import { createProgressiveRelease, fetchReleaseDashboard } from "@/server/services/workflows/release-manager-service";
import { fetchWorkflowById } from "@/server/services/workflows/workflow-service";

const createReleaseSchema = z.object({
  stableWorkflowId: z.string().trim().min(1),
  canaryWorkflowId: z.string().trim().min(1),
  canaryTrafficPercent: z.number().int().min(1).max(95).default(10),
  autoRollbackEnabled: z.boolean().default(true),
  failureThresholdPct: z.number().min(1).max(100).default(20),
  minCanarySampleSize: z.number().int().min(5).max(500).default(20),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const items = await fetchReleaseDashboard(user.organizationId!);

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const body = await validateJson(request, createReleaseSchema);
  if (!body.success) {
    return NextResponse.json({ error: body.error, issues: body.issues }, { status: 400 });
  }

  const stable = await fetchWorkflowById({
    organizationId: user.organizationId!,
    workflowId: body.data.stableWorkflowId,
  });
  const canary = await fetchWorkflowById({
    organizationId: user.organizationId!,
    workflowId: body.data.canaryWorkflowId,
  });

  if (!stable || !canary) {
    return NextResponse.json({ error: "Stable or canary workflow not found" }, { status: 404 });
  }
  if (stable.agentId !== canary.agentId) {
    return NextResponse.json({ error: "Stable and canary workflows must belong to the same agent" }, { status: 400 });
  }

  const release = await createProgressiveRelease({
    organizationId: user.organizationId!,
    agentId: stable.agentId,
    stableWorkflowId: stable.id,
    canaryWorkflowId: canary.id,
    canaryTrafficPercent: body.data.canaryTrafficPercent,
    autoRollbackEnabled: body.data.autoRollbackEnabled,
    failureThresholdPct: body.data.failureThresholdPct,
    minCanarySampleSize: body.data.minCanarySampleSize,
  });

  return NextResponse.json({ release }, { status: 201 });
}
