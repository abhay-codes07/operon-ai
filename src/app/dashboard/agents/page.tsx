import { CreateAgentModal } from "@/components/dashboard/agents/create-agent-modal";
import { AgentsTable } from "@/components/dashboard/agents/agents-table";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";

export default async function DashboardAgentsPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const result = await fetchAgentCatalog({
    organizationId: user.organizationId!,
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
        <AgentsTable agents={result.items} />
      </DashboardCard>
    </div>
  );
}
