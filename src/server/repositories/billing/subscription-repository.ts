import { prisma } from "@/server/db/client";

import type { SubscriptionSnapshot } from "@/modules/billing/contracts";

export async function getOrganizationSubscription(
  organizationId: string,
): Promise<SubscriptionSnapshot | null> {
  return prisma.subscription.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      organizationId: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
): Promise<SubscriptionSnapshot | null> {
  return prisma.subscription.findFirst({
    where: { stripeCustomerId },
    select: {
      id: true,
      organizationId: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });
}

export async function upsertOrganizationSubscription(input: {
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  plan: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<SubscriptionSnapshot> {
  const existing = await getOrganizationSubscription(input.organizationId);

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        plan: input.plan,
        status: input.status,
        currentPeriodStart: input.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      },
      select: {
        id: true,
        organizationId: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      organizationId: input.organizationId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      plan: input.plan,
      status: input.status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
    },
    select: {
      id: true,
      organizationId: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });
}
