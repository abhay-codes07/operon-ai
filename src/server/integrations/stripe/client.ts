import Stripe from "stripe";

import { getAppEnv } from "@/config/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const env = getAppEnv();
  stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });

  return stripeClient;
}
