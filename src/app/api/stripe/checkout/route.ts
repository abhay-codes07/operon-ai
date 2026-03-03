import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { createCheckoutSession } from "@/server/integrations/stripe/checkout";
import { enforceRateLimit } from "@/server/security/rate-limit";

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH"]),
});

export async function POST(request: Request) {
  const user = await requireOrganizationRole("OWNER");
  const throttleResponse = enforceRateLimit(
    request,
    "billing:checkout",
    { maxRequests: 8, windowMs: 60_000 },
    user.id,
  );
  if (throttleResponse) {
    return throttleResponse;
  }

  const { data, error } = await parseJsonBody(request, checkoutSchema);
  if (error) {
    return error;
  }

  const host = headers().get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const session = await createCheckoutSession({
    organizationId: user.organizationId!,
    customerEmail: user.email ?? "billing@webops.ai",
    plan: data.plan,
    successUrl: `${baseUrl}/dashboard/billing?checkout=success`,
    cancelUrl: `${baseUrl}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
