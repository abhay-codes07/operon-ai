import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { StatusFilter } from "@/components/dashboard/layout/status-filter";
import { CreateWorkflowModal } from "@/components/dashboard/workflows/create-workflow-modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { WorkflowsTable } from "@/components/dashboard/workflows/workflows-table";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { fetchWorkflowCatalog } from "@/server/services/workflows/workflow-service";

type DashboardWorkflowsPageProps = {
  searchParams?: {
    status?: string;
  };
};

export default async function DashboardWorkflowsPage({
  searchParams,
}: DashboardWorkflowsPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const statusFilter =
    searchParams?.status === "DRAFT" ||
    searchParams?.status === "ACTIVE" ||
    searchParams?.status === "PAUSED" ||
    searchParams?.status === "ARCHIVED"
      ? searchParams.status
      : undefined;
  const agents = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    status: "ACTIVE",
    page: 1,
    pageSize: 100,
  });
  const workflows = await fetchWorkflowCatalog({
    organizationId: user.organizationId!,
    status: statusFilter,
    page: 1,
    pageSize: 25,
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Workflow Builder"
        title="Workflow Library"
        description="Design, schedule, and deploy deterministic multi-step browser operations."
        actions={<CreateWorkflowModal agents={agents.items.map((agent) => ({ id: agent.id, name: agent.name }))} />}
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
        <WorkflowsTable items={workflows.items} />
      </DashboardCard>
    </div>
  );
}
