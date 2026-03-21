import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");

  // Fetch all executions that have a swarmId in their inputPayload, limited to recent ones
  const rawExecutions = await prisma.execution.findMany({
    where: {
      organizationId: user.organizationId!,
      inputPayload: {
        not: null,
      },
    },
    select: {
      id: true,
      status: true,
      inputPayload: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 500,
  });

  // Filter those with a swarmId and group by swarmId
  const swarmMap = new Map<
    string,
    {
      swarmId: string;
      createdAt: Date;
      executions: Array<{ id: string; status: string; targetUrl?: string }>;
    }
  >();

  for (const exec of rawExecutions) {
    const payload = exec.inputPayload as Record<string, unknown> | null;
    if (!payload || typeof payload.swarmId !== "string") continue;

    const swarmId = payload.swarmId;
    const targetUrl =
      typeof payload.targetUrl === "string" ? payload.targetUrl : undefined;

    if (!swarmMap.has(swarmId)) {
      swarmMap.set(swarmId, {
        swarmId,
        createdAt: exec.createdAt,
        executions: [],
      });
    }

    const swarm = swarmMap.get(swarmId)!;
    swarm.executions.push({ id: exec.id, status: exec.status, targetUrl });

    // Track earliest createdAt as the swarm's createdAt
    if (exec.createdAt < swarm.createdAt) {
      swarm.createdAt = exec.createdAt;
    }
  }

  // Sort swarms by most recent first and return top 20
  const swarms = Array.from(swarmMap.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);

  return NextResponse.json(swarms);
}
