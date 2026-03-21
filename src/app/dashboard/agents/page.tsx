import { CreateAgentModal } from "@/components/dashboard/agents/create-agent-modal";
import { AgentsTable } from "@/components/dashboard/agents/agents-table";
import { AgentComparisonLeaderboard } from "@/components/dashboard/agents/agent-comparison-leaderboard";
import { StatusFilter } from "@/components/dashboard/layout/status-filter";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { fetchReliabilityDashboard } from "@/server/services/agents/reliability-service";

type DashboardAgentsPageProps = {
  searchParams?: {
    status?: string;
  };
};

export default async function DashboardAgentsPage({
  searchParams,
}: DashboardAgentsPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const statusFilter =
    searchParams?.status === "DRAFT" ||
    searchParams?.status === "ACTIVE" ||
    searchParams?.status === "PAUSED" ||
    searchParams?.status === "ARCHIVED"
      ? searchParams.status
      : undefined;

  const [result, reliabilityRows] = await Promise.all([
    fetchAgentCatalog({
      organizationId: user.organizationId!,
      status: statusFilter,
      page: 1,
      pageSize: 25,
    }),
    fetchReliabilityDashboard(user.organizationId!),
  ]);

  // Build name map from agents
  const agentNameMap = new Map(result.items.map((a) => [a.id, { name: a.name, status: a.status }]));

  const leaderboardEntries = reliabilityRows
    .filter((row: (typeof reliabilityRows)[number]) => row.totalExecutions > 0)
    .map((row: (typeof reliabilityRows)[number], index: number) => ({
      rank: index + 1,
      agentId: row.agentId,
      agentName: agentNameMap.get(row.agentId)?.name ?? `Agent …${row.agentId.slice(-6)}`,
      agentStatus: agentNameMap.get(row.agentId)?.status ?? "UNKNOWN",
      reliabilityScore: row.reliabilityScore,
      successRate: row.successRate,
      totalExecutions: row.totalExecutions,
      avgExecutionMs: row.avgExecutionMs,
      failureFrequency: row.failureFrequency,
    }));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Autonomous Agents"
        title="Agent Registry"
        description="Provision and monitor the agents responsible for website workflow execution."
      />

      {/* Comparison Leaderboard */}
      <DashboardCard
        title="Agent Performance Leaderboard"
        description="Ranked by reliability score — composite of success rate, retry rate, and average execution speed."
      >
        <AgentComparisonLeaderboard entries={leaderboardEntries} />
      </DashboardCard>

      {/* Agent table */}
      <DashboardCard title="All Agents">
        <div className="flex items-center justify-between gap-4 mb-4">
          <StatusFilter
            options={[
              { label: "All", value: "ALL" },
              { label: "Draft", value: "DRAFT" },
              { label: "Active", value: "ACTIVE" },
              { label: "Paused", value: "PAUSED" },
              { label: "Archived", value: "ARCHIVED" },
            ]}
          />
          <CreateAgentModal organizationName={user.organizationName} />
        </div>
        <AgentsTable agents={result.items} />
      </DashboardCard>
    </div>
  );
}
