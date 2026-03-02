import type Stripe from "stripe";

import { getAppEnv } from "@/config/env";
import { getStripeClient } from "@/server/integrations/stripe/client";

export async function createCheckoutSession(input: {
  organizationId: string;
  customerEmail: string;
  plan: "STARTER" | "GROWTH";
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const env = getAppEnv();

  const planPriceLookup: Record<"STARTER" | "GROWTH", string> = {
    STARTER: env.STRIPE_PRICE_STARTER,
    GROWTH: env.STRIPE_PRICE_GROWTH,
  };

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
        price: planPriceLookup[input.plan],
        quantity: 1,
      },
    ],
  });
}
