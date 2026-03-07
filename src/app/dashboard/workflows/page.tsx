import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { StatusFilter } from "@/components/dashboard/layout/status-filter";
import { CreateWorkflowModal } from "@/components/dashboard/workflows/create-workflow-modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { WorkflowsTable } from "@/components/dashboard/workflows/workflows-table";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { prisma } from "@/server/db/client";
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
  const workflowIds = workflows.items.map((item) => item.id);
  const [slaRows, incidentRows] = workflowIds.length
    ? await Promise.all([
        prisma.workflowSLA.findMany({
          where: { workflowId: { in: workflowIds } },
          select: {
            workflowId: true,
            maxFailureRate: true,
          },
        }),
        prisma.sLABreachIncident.findMany({
          where: {
            workflowId: { in: workflowIds },
            resolvedAt: null,
          },
          select: {
            workflowId: true,
            detectedAt: true,
          },
        }),
      ])
    : [[], []];
  const slaMap = new Map(slaRows.map((row) => [row.workflowId, row]));
  const incidentCountMap = new Map<string, number>();
  for (const incident of incidentRows) {
    incidentCountMap.set(incident.workflowId, (incidentCountMap.get(incident.workflowId) ?? 0) + 1);
  }
  const openBreachCount = incidentRows.length;

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
        {openBreachCount > 0 ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {openBreachCount} active SLA breach incident{openBreachCount === 1 ? "" : "s"} detected.
          </div>
        ) : null}
        <WorkflowsTable
          items={workflows.items.map((item) => {
            const hasSla = slaMap.has(item.id);
            const breaches = incidentCountMap.get(item.id) ?? 0;
            const sla = slaMap.get(item.id);
            const warning = hasSla && breaches === 0 && (sla?.maxFailureRate ?? 0) <= 0.1;
            return {
              ...item,
              hasSla,
              slaState: breaches > 0 ? "BREACHED" : warning ? "WARNING" : "HEALTHY",
            };
          })}
        />
      </DashboardCard>
    </div>
  );
}
