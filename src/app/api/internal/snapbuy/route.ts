import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import { prisma } from "@/server/db/client";
import { queueExecution } from "@/server/services/executions/execution-service";

const snapbuySchema = z.object({
  name: z.string().min(1),
  watchUrl: z.string().url(),
  triggerCondition: z.string().min(1),
  actionTask: z.string().min(1),
  agentId: z.string().min(1),
  savedDetails: z.string().optional(),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");

  const workflows = await prisma.workflow.findMany({
    where: {
      organizationId: user.organizationId!,
      definition: { path: ["type"], equals: "snapbuy" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      definition: true,
      createdAt: true,
    },
  });

  const snipes = workflows.map((w) => {
    const def = w.definition as Record<string, unknown>;
    return {
      id: w.id,
      name: w.name,
      watchUrl: (def.watchUrl as string) ?? "",
      triggerCondition: (def.triggerCondition as string) ?? "",
      actionTask: (def.actionTask as string) ?? "",
      status: (def.status as string) ?? "WATCHING",
      checkCount: 0,
    };
  });

  return NextResponse.json({ snipes });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, snapbuySchema);
  if (error) return error;

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: user.organizationId!,
      agentId: data.agentId,
      createdById: user.id,
      name: data.name,
      status: "ACTIVE",
      definition: {
        type: "snapbuy",
        watchUrl: data.watchUrl,
        triggerCondition: data.triggerCondition,
        actionTask: data.actionTask,
        savedDetails: data.savedDetails ?? "",
        status: "WATCHING",
        naturalLanguageTask: `Watch ${data.watchUrl} and ${data.actionTask} when: ${data.triggerCondition}`,
        steps: [],
        guardrails: [],
        timeoutSeconds: 30,
        retryLimit: 2,
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
      snapbuyMode: true,
      triggerCondition: data.triggerCondition,
      actionTask: data.actionTask,
    },
  });

  // Trigger worker (fire-and-forget from server; client also triggers independently)
  const baseUrl = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (baseUrl) {
    const headers: Record<string, string> = {};
    if (process.env.CRON_SECRET) {
      headers["authorization"] = `Bearer ${process.env.CRON_SECRET}`;
    }
    fetch(`${baseUrl}/api/worker/run`, { headers }).catch(() => null);
  }

  return NextResponse.json({ snipeId: workflow.id }, { status: 201 });
}
