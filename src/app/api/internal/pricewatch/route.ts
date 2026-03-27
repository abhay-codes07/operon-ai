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

const mockWatches = [
  {
    id: "pw-1",
    productName: "Sony WH-1000XM5 Headphones",
    productUrl: "amazon.com/sony-wh1000xm5",
    currentPrice: 279,
    targetPrice: 249,
    lowestEver: 228,
    status: "WATCHING",
    checksToday: 24,
    lastChecked: "12 minutes ago",
    retailer: "Amazon",
  },
  {
    id: "pw-2",
    productName: 'MacBook Pro M4 14"',
    productUrl: "apple.com/macbook-pro",
    currentPrice: 1599,
    targetPrice: 1399,
    lowestEver: 1499,
    status: "ALERT_SENT",
    checksToday: 24,
    lastChecked: "3 hours ago",
    alertSentAt: "3 hours ago",
    alertPrice: 1499,
    retailer: "Apple",
  },
  {
    id: "pw-3",
    productName: "Dyson V15 Detect Vacuum",
    productUrl: "bestbuy.com/dyson-v15",
    currentPrice: 649,
    targetPrice: 499,
    lowestEver: 524,
    status: "WATCHING",
    checksToday: 24,
    lastChecked: "1 hour ago",
    retailer: "Best Buy",
  },
];

export async function GET() {
  await requireOrganizationRole("MEMBER");
  return NextResponse.json({ watches: mockWatches });
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
        checkIntervalHours: data.checkIntervalHours,
        status: "WATCHING",
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

  return NextResponse.json({ watchId: workflow.id }, { status: 201 });
}
