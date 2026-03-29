import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import { prisma } from "@/server/db/client";
import { queueExecution } from "@/server/services/executions/execution-service";

const ethicswatchSchema = z.object({
  organizationName: z.string().min(1),
  organizationUrl: z.string().url(),
  watchCategories: z
    .array(
      z.enum([
        "ESG",
        "GOVERNANCE",
        "ENVIRONMENT",
        "SOCIAL",
        "REGULATIONS",
        "SUPPLY_CHAIN",
      ]),
    )
    .min(1),
  agentId: z.string().min(1),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");

  const workflows = await prisma.workflow.findMany({
    where: {
      organizationId: user.organizationId!,
      definition: { path: ["type"], equals: "ethicswatch" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      definition: true,
      createdAt: true,
    },
  });

  const monitors = workflows.map((w) => {
    const def = w.definition as Record<string, unknown>;
    return {
      id: w.id,
      organizationName: w.name,
      organizationUrl: (def.organizationUrl as string) ?? "",
      categories: (def.watchCategories as string[]) ?? [],
      status: (def.status as string) ?? "MONITORING",
      severity: null,
      lastChange: null,
      monitoringSince: "just added",
      changesDetected: 0,
      lastScanned: "pending",
    };
  });

  return NextResponse.json({ monitors });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, ethicswatchSchema);
  if (error) return error;

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: user.organizationId!,
      agentId: data.agentId,
      createdById: user.id,
      name: data.organizationName,
      status: "ACTIVE",
      definition: {
        type: "ethicswatch",
        organizationUrl: data.organizationUrl,
        watchCategories: data.watchCategories,
        status: "MONITORING",
        naturalLanguageTask: `Monitor ESG and compliance changes for ${data.organizationName} across ${data.watchCategories.join(", ")} categories`,
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
      ethicswatchMode: true,
      organizationUrl: data.organizationUrl,
      watchCategories: data.watchCategories,
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

  return NextResponse.json({ watchId: workflow.id }, { status: 201 });
}
