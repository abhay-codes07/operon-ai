import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SwarmLaunchForm } from "@/components/dashboard/swarm/swarm-launch-form";
import { SwarmHistoryGrid } from "@/components/dashboard/swarm/swarm-history-grid";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { prisma } from "@/server/db/client";

async function fetchRecentSwarms(organizationId: string) {
  const rawExecutions = await prisma.execution.findMany({
    where: {
      organizationId,
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

    if (exec.createdAt < swarm.createdAt) {
      swarm.createdAt = exec.createdAt;
    }
  }

  return Array.from(swarmMap.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);
}

export default async function DashboardSwarmPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const [agentsResult, recentSwarms] = await Promise.all([
    fetchAgentCatalog({
      organizationId: user.organizationId!,
      status: "ACTIVE",
      page: 1,
      pageSize: 50,
    }).catch(() => ({ items: [] as Array<{ id: string; name: string }> })),
    fetchRecentSwarms(user.organizationId!).catch(() => []),
  ]);

  const agents = agentsResult.items.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Multi-Agent Coordination"
        title="Swarm Orchestrator"
        description="Launch parallel agent executions across multiple target URLs in a single coordinated swarm."
      />

      {/* Launch panel */}
      <DashboardCard
        title="Launch Swarm"
        description="Select an agent and provide target URLs. Each URL becomes an independent execution tagged with a shared swarm ID."
      >
        <SwarmLaunchForm agents={agents} />
      </DashboardCard>

      {/* History */}
      <DashboardCard
        title="Swarm History"
        description="Recent swarm sessions and their execution status breakdown."
      >
        <SwarmHistoryGrid swarms={recentSwarms} />
      </DashboardCard>
    </div>
  );
}
