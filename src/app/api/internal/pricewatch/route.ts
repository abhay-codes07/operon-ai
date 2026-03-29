import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import { prisma } from "@/server/db/client";
import { queueExecution } from "@/server/services/executions/execution-service";

const pricewatchSchema = z.object({
  productName: z.string().min(1),
  productUrl: z.string().url(),
  targetPrice: z.number().positive(),
  currentPrice: z.number().positive().optional(),
  agentId: z.string().min(1),
  checkIntervalHours: z.number().int().min(1).max(24).default(1),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");

  const workflows = await prisma.workflow.findMany({
    where: {
      organizationId: user.organizationId!,
      definition: { path: ["type"], equals: "pricewatch" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      definition: true,
      createdAt: true,
    },
  });

  const watches = workflows.map((w) => {
    const def = w.definition as Record<string, unknown>;
    return {
      id: w.id,
      productName: w.name,
      productUrl: (def.productUrl as string) ?? "",
      currentPrice: (def.currentPrice as number) ?? (def.targetPrice as number) ?? 0,
      targetPrice: (def.targetPrice as number) ?? 0,
      lowestEver: (def.currentPrice as number) ?? (def.targetPrice as number) ?? 0,
      status: (def.status as string) ?? "WATCHING",
      checksToday: 0,
      priceHistory: [(def.currentPrice as number) ?? (def.targetPrice as number) ?? 0],
      savings: 0,
      percentOff: 0,
      lastChecked: "pending",
      retailer: "Web",
    };
  });

  return NextResponse.json({ watches });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, pricewatchSchema);
  if (error) return error;

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: user.organizationId!,
      agentId: data.agentId,
      createdById: user.id,
      name: data.productName,
      status: "ACTIVE",
      definition: {
        type: "pricewatch",
        productUrl: data.productUrl,
        targetPrice: data.targetPrice,
        currentPrice: data.currentPrice,
        checkIntervalHours: data.checkIntervalHours,
        status: "WATCHING",
        naturalLanguageTask: `Monitor the price of ${data.productName} and alert when it drops below $${data.targetPrice}`,
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
      pricewatchMode: true,
      productUrl: data.productUrl,
      targetPrice: data.targetPrice,
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
