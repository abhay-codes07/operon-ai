import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";
import { ResultsHub } from "@/components/dashboard/results/results-hub";
import { SectionHeading } from "@/components/ui/section-heading";

export default async function ResultsHubPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const [items, total] = await Promise.all([
    prisma.execution.findMany({
      where: { organizationId: user.organizationId! },
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
      take: 20,
    }),
    prisma.execution.count({ where: { organizationId: user.organizationId! } }),
  ]);

  const mapped = items.map((e) => ({
    id: e.id,
    status: e.status as "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED",
    trigger: e.trigger,
    agentId: e.agentId,
    agentName: e.agent?.name ?? null,
    workflowId: e.workflowId,
    workflowName: e.workflow?.name ?? null,
    errorMessage: e.errorMessage,
    outputPayload: e.outputPayload as Record<string, unknown> | null,
    createdAt: e.createdAt.toISOString(),
    startedAt: e.startedAt?.toISOString() ?? null,
    finishedAt: e.finishedAt?.toISOString() ?? null,
    durationMs:
      e.startedAt && e.finishedAt
        ? e.finishedAt.getTime() - e.startedAt.getTime()
        : null,
  }));

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Results Hub"
        title="All Agent Runs & Outputs"
        description="Every execution with its structured output — prices, data, jobs, or errors. Auto-refreshes while agents are running."
      />
      <ResultsHub initialItems={mapped} initialTotal={total} />
    </div>
  );
}
