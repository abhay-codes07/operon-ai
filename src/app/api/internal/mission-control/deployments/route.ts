import { NextResponse } from "next/server";
import { z } from "zod";

import { validateJson } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { deployAgent, fetchAgentDeploymentState } from "@/server/services/mission-control/deployment-service";

const deployAgentBodySchema = z.object({
  agentId: z.string().trim().min(1),
  desiredRuns: z.coerce.number().int().min(1).max(100).default(1),
  notes: z.string().trim().max(500).optional(),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const deployments = await fetchAgentDeploymentState(user.organizationId!);

  return NextResponse.json({ deployments });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const body = await validateJson(request, deployAgentBodySchema);
  if (!body.success) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const deployment = await deployAgent({
    organizationId: user.organizationId!,
    agentId: body.data.agentId,
    desiredRuns: body.data.desiredRuns,
    notes: body.data.notes,
  });

  return NextResponse.json({ deployment }, { status: 201 });
}
