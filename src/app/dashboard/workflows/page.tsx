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
    query?: string;
  };
};

export default async function DashboardWorkflowsPage({
  searchParams,
}: DashboardWorkflowsPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const queryFilter = searchParams?.query?.trim();
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
    query: queryFilter,
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
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form method="GET" className="w-full md:max-w-sm">
            <label htmlFor="workflow-query" className="sr-only">
              Search workflows
            </label>
            <input
              id="workflow-query"
              name="query"
              defaultValue={queryFilter}
              placeholder="Search workflow by name or description"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            />
          </form>
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
