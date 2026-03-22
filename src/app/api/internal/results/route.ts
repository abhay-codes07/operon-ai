import { NextResponse } from "next/server";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export async function GET(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where = {
    organizationId: user.organizationId!,
    ...(status && status !== "ALL" ? { status: status as never } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      select: {
        id: true,
        status: true,
        trigger: true,
        agentId: true,
        workflowId: true,
        errorMessage: true,
        outputPayload: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        agent: { select: { name: true } },
        workflow: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.execution.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((e) => ({
      id: e.id,
      status: e.status,
      trigger: e.trigger,
      agentId: e.agentId,
      agentName: e.agent?.name ?? null,
      workflowId: e.workflowId,
      workflowName: e.workflow?.name ?? null,
      errorMessage: e.errorMessage,
      outputPayload: e.outputPayload,
      createdAt: e.createdAt.toISOString(),
      startedAt: e.startedAt?.toISOString() ?? null,
      finishedAt: e.finishedAt?.toISOString() ?? null,
      durationMs:
        e.startedAt && e.finishedAt
          ? e.finishedAt.getTime() - e.startedAt.getTime()
          : null,
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  });
}
