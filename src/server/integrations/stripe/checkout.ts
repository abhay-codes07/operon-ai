import type Stripe from "stripe";

import { getStripeClient } from "@/server/integrations/stripe/client";

const PLAN_PRICE_LOOKUP: Record<"STARTER" | "GROWTH", string> = {
  STARTER: "price_starter_placeholder",
  GROWTH: "price_growth_placeholder",
};

export async function createCheckoutSession(input: {
  organizationId: string;
  customerEmail: string;
  plan: "STARTER" | "GROWTH";
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      organizationId: input.organizationId,
      plan: input.plan,
    },
    line_items: [
      {
        price: PLAN_PRICE_LOOKUP[input.plan],
        quantity: 1,
      },
    ],
  });
}
