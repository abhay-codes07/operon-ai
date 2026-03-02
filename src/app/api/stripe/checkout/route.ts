import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { createCheckoutSession } from "@/server/integrations/stripe/checkout";

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH"]),
});

export async function POST(request: Request) {
  const user = await requireOrganizationRole("OWNER");
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
  }

  const host = headers().get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const session = await createCheckoutSession({
    organizationId: user.organizationId!,
    customerEmail: user.email ?? "billing@webops.ai",
    plan: parsed.data.plan,
    successUrl: `${baseUrl}/dashboard/billing?checkout=success`,
    cancelUrl: `${baseUrl}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
