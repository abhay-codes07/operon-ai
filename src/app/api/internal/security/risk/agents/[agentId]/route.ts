import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { analyzeAgentActionRisk } from "@/server/services/security/risk-analysis-service";

const paramsSchema = z.object({
  agentId: z.string().trim().min(1),
});

const querySchema = z.object({
  targetDomain: z.string().trim().optional(),
  policyDenied: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

type RouteContext = {
  params: {
    agentId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid agent identifier" }, { status: 400 });
  }
  const parsedQuery = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const risk = await analyzeAgentActionRisk({
    organizationId: user.organizationId!,
    agentId: parsedParams.data.agentId,
    targetDomain: parsedQuery.data.targetDomain,
    policyDenied: parsedQuery.data.policyDenied,
  });

  return NextResponse.json(risk);
}
