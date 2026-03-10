import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentMemoryContext } from "@/server/services/agents/memory-service";

const paramsSchema = z.object({
  agentId: z.string().trim().min(1),
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

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("workflowId") ?? undefined;

  const memory = await fetchAgentMemoryContext({
    organizationId: user.organizationId!,
    agentId: parsedParams.data.agentId,
    ...(workflowId ? { workflowId } : {}),
  });

  return NextResponse.json({
    agentId: parsedParams.data.agentId,
    workflowId,
    memory,
  });
}
