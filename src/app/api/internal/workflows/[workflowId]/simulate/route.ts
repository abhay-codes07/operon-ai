import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchWorkflowById } from "@/server/services/workflows/workflow-service";
import {
  fetchRecentWorkflowSimulations,
  simulateWorkflowExecution,
} from "@/server/services/workflows/simulation-engine";

const paramsSchema = z.object({
  workflowId: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    workflowId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid workflow identifier" }, { status: 400 });
  }

  const simulations = await fetchRecentWorkflowSimulations({
    organizationId: user.organizationId!,
    workflowId: parsedParams.data.workflowId,
  });

  return NextResponse.json({ simulations });
}

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid workflow identifier" }, { status: 400 });
  }

  const workflow = await fetchWorkflowById({
    organizationId: user.organizationId!,
    workflowId: parsedParams.data.workflowId,
  });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const definition = workflow.definition as {
    steps?: Array<{ id?: string; action?: string; target?: string; expectedOutcome?: string }>;
  };

  const simulation = await simulateWorkflowExecution({
    organizationId: user.organizationId!,
    workflowId: workflow.id,
    requestedById: user.id,
    steps: definition.steps ?? [],
  });

  return NextResponse.json({ simulation }, { status: 201 });
}
