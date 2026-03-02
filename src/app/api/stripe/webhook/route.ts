import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAppEnv } from "@/config/env";
import { getStripeClient } from "@/server/integrations/stripe/client";
import {
  getSubscriptionByStripeCustomerId,
  upsertOrganizationSubscription,
} from "@/server/repositories/billing/subscription-repository";

function mapStripeStatusToInternal(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
      return "PAST_DUE" as const;
    case "incomplete":
      return "INCOMPLETE" as const;
    case "canceled":
      return "CANCELED" as const;
    default:
      return "INCOMPLETE" as const;
  }
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const webhookSecret = getAppEnv().STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const organizationId = session.metadata?.organizationId;
    const plan = session.metadata?.plan as "STARTER" | "GROWTH" | undefined;

    if (organizationId && session.customer && plan) {
      await upsertOrganizationSubscription({
        organizationId,
        stripeCustomerId: String(session.customer),
        stripeSubscriptionId: session.subscription ? String(session.subscription) : null,
        plan,
        status: "ACTIVE",
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const matched = await getSubscriptionByStripeCustomerId(String(subscription.customer));

    if (matched) {
      await upsertOrganizationSubscription({
        organizationId: matched.organizationId,
        stripeCustomerId: String(subscription.customer),
        stripeSubscriptionId: subscription.id,
        plan: matched.plan,
        status: mapStripeStatusToInternal(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    }
  }

  return NextResponse.json({ received: true });
}
