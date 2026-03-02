import { CreateAgentModal } from "@/components/dashboard/agents/create-agent-modal";
import { AgentsTable } from "@/components/dashboard/agents/agents-table";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { StatusFilter } from "@/components/dashboard/layout/status-filter";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";

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
  const result = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    status: statusFilter,
    page: 1,
    pageSize: 25,
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Agent Registry"
        title="Autonomous Web Agents"
        description="Provision and monitor the agents responsible for website workflow execution."
        actions={<CreateAgentModal organizationName={user.organizationName} />}
      />

      <DashboardCard>
        <div className="mb-4">
          <StatusFilter
            options={[
              { label: "All", value: "ALL" },
              { label: "Draft", value: "DRAFT" },
              { label: "Active", value: "ACTIVE" },
              { label: "Paused", value: "PAUSED" },
              { label: "Archived", value: "ARCHIVED" },
            ]}
          />
        </div>
        <AgentsTable agents={result.items} />
      </DashboardCard>
    </div>
  );
}
