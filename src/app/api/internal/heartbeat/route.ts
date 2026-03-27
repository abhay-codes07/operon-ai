import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import { prisma } from "@/server/db/client";
import { queueExecution } from "@/server/services/executions/execution-service";

const heartbeatSchema = z.object({
  name: z.string().min(1),
  targetUrl: z.string().url(),
  steps: z.array(z.string()).min(1).max(20),
  agentId: z.string().min(1),
  checkIntervalMinutes: z.number().int().min(5).max(1440).default(15),
});

const mockJourneys = [
  {
    id: "hb-1",
    name: "New User Signup Flow",
    targetUrl: "app.operon-ai.com",
    steps: [
      "Land on homepage",
      "Click Get Started",
      "Fill signup form",
      "Verify email confirmation page loads",
      "Complete onboarding checklist",
    ],
    status: "HEALTHY",
    uptime: 99.7,
    avgDurationMs: 18400,
    lastRunAt: "4 minutes ago",
    lastRunStatus: "PASSED",
    checksToday: 96,
    failuresLast7d: 1,
    heartbeatHistory: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    id: "hb-2",
    name: "Checkout & Payment Flow",
    targetUrl: "app.operon-ai.com/billing",
    steps: [
      "Navigate to billing",
      "Click Upgrade to Pro",
      "Fill payment form with test card 4242 4242 4242 4242",
      "Confirm subscription confirmation page",
      "Verify email receipt mention",
    ],
    status: "DEGRADED",
    uptime: 94.2,
    avgDurationMs: 31200,
    lastRunAt: "19 minutes ago",
    lastRunStatus: "FAILED",
    failureStep: "Fill payment form with test card 4242 4242 4242 4242",
    failureReason: "Payment form did not render within 8 seconds — possible Stripe JS load failure",
    checksToday: 96,
    failuresLast7d: 8,
    heartbeatHistory: [1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0],
  },
  {
    id: "hb-3",
    name: "Agent Creation Flow",
    targetUrl: "app.operon-ai.com/dashboard/agents",
    steps: [
      "Login as test user",
      "Click Create Agent",
      "Fill agent name and description",
      "Submit form",
      "Verify agent appears in agents list",
    ],
    status: "HEALTHY",
    uptime: 100,
    avgDurationMs: 12100,
    lastRunAt: "2 minutes ago",
    lastRunStatus: "PASSED",
    checksToday: 96,
    failuresLast7d: 0,
    heartbeatHistory: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
];

export async function GET() {
  await requireOrganizationRole("MEMBER");
  return NextResponse.json({ journeys: mockJourneys });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, heartbeatSchema);
  if (error) return error;

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: user.organizationId!,
      agentId: data.agentId,
      createdById: user.id,
      name: data.name,
      status: "ACTIVE",
      definition: {
        type: "heartbeat",
        targetUrl: data.targetUrl,
        steps: data.steps,
        checkIntervalMinutes: data.checkIntervalMinutes,
        status: "HEALTHY",
      },
    },
  });

  await queueExecution({
    organizationId: user.organizationId!,
    agentId: data.agentId,
    workflowId: workflow.id,
    requestedById: user.id,
    trigger: "MANUAL",
    inputPayload: {
      heartbeatMode: true,
      steps: data.steps,
    },
  });

  return NextResponse.json({ journeyId: workflow.id }, { status: 201 });
}
