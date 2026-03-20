import { CreateAgentModal } from "@/components/dashboard/agents/create-agent-modal";
import { AgentsTable } from "@/components/dashboard/agents/agents-table";
import { StatusFilter } from "@/components/dashboard/layout/status-filter";
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Autonomous Web Agents</h1>
        <p className="text-orange-100 text-lg">Agent Registry</p>
        <p className="text-orange-200 text-sm mt-2">Provision and monitor the agents responsible for website workflow execution.</p>
      </div>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-6 space-y-6">
        {/* Filter and Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-slate-300 font-semibold">Filter by Status</p>
          </div>
          <div className="flex gap-3">
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
        </div>

        {/* Agents Table */}
        <AgentsTable agents={result.items} />
      </div>
    </div>
  );
}
