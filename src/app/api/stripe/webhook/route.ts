import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import { getAppEnv } from "@/config/env";
import { getStripeClient } from "@/server/integrations/stripe/client";
import { logWarn } from "@/server/observability/logger";
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

const checkoutMetadataSchema = z.object({
  organizationId: z.string().trim().min(1),
  plan: z.enum(["STARTER", "GROWTH"]),
});

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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = checkoutMetadataSchema.safeParse(session.metadata);

      if (!metadata.success || !session.customer) {
        logWarn("Ignoring checkout session with incomplete metadata", {
          component: "stripe-webhook",
          metadata: {
            eventId: event.id,
          },
        });
        return NextResponse.json({ received: true });
      }

      await upsertOrganizationSubscription({
        organizationId: metadata.data.organizationId,
        stripeCustomerId: String(session.customer),
        stripeSubscriptionId: session.subscription ? String(session.subscription) : null,
        plan: metadata.data.plan,
        status: "ACTIVE",
      });
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeSubscription = subscription as Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
        cancel_at_period_end?: boolean;
      };
      const matched = await getSubscriptionByStripeCustomerId(String(subscription.customer));

      if (matched) {
        await upsertOrganizationSubscription({
          organizationId: matched.organizationId,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          plan: matched.plan,
          status: mapStripeStatusToInternal(subscription.status),
          currentPeriodStart: stripeSubscription.current_period_start
            ? new Date(stripeSubscription.current_period_start * 1000)
            : null,
          currentPeriodEnd: stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logWarn("Stripe webhook processing failed", {
      component: "stripe-webhook",
      metadata: {
        eventId: event.id,
        type: event.type,
        error: error instanceof Error ? error.message : "Unknown webhook error",
      },
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
