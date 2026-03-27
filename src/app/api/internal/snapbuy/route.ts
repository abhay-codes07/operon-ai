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

const mockSnipes = [
  {
    id: "snipe-1",
    name: "RTX 5090 GPU Restock",
    watchUrl: "bestbuy.com/rtx-5090",
    triggerCondition: "Item comes back in stock",
    actionTask: "Add to cart and complete checkout with saved payment",
    status: "TRIGGERED",
    triggeredAt: "2 minutes ago",
    result: "Successfully purchased — Order #BB-2847291",
    checkCount: 847,
  },
  {
    id: "snipe-2",
    name: "iPhone 16 Pro — Price Drop",
    watchUrl: "amazon.com/iphone-16-pro",
    triggerCondition: "Price drops below $899",
    actionTask: "Add to cart, apply any available coupons, checkout",
    status: "WATCHING",
    currentValue: "$979",
    targetValue: "$899",
    checkCount: 234,
  },
  {
    id: "snipe-3",
    name: "Taylor Swift Eras Tour Ticket",
    watchUrl: "ticketmaster.com/taylor-swift-eras",
    triggerCondition: "Any floor/pit tickets become available under $400",
    actionTask: "Select best available seats and complete purchase",
    status: "WATCHING",
    currentValue: "Sold Out",
    checkCount: 1203,
  },
];

export async function GET() {
  await requireOrganizationRole("MEMBER");
  return NextResponse.json({ snipes: mockSnipes });
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

  return NextResponse.json({ snipeId: workflow.id }, { status: 201 });
}
