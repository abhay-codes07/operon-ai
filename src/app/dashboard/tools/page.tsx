import { ToolCard } from "@/components/dashboard/tools/tool-card";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { retrieveToolCatalog } from "@/server/services/tools/tool-registry-service";
import { fetchWorkflowCatalog } from "@/server/services/workflows/workflow-service";

type DashboardToolsPageProps = {
  searchParams?: {
    query?: string;
  };
};

export default async function DashboardToolsPage({
  searchParams,
}: DashboardToolsPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const query = searchParams?.query?.trim();

  const [tools, workflows] = await Promise.all([
    retrieveToolCatalog({
      organizationId: user.organizationId!,
      query,
    }),
    fetchWorkflowCatalog({
      organizationId: user.organizationId!,
      page: 1,
      pageSize: 100,
    }),
  ]);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Tool Marketplace"
        title="Dynamic Tool Registry"
        description="Search, evaluate, and install reusable generated automation tools."
      />
      <DashboardCard>
        <form method="GET" className="mb-4 md:max-w-sm">
          <label htmlFor="tool-query" className="sr-only">
            Search tools
          </label>
          <input
            id="tool-query"
            name="query"
            defaultValue={query}
            placeholder="Search tools by name or description"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          />
        </form>

        {tools.length === 0 ? (
          <p className="text-sm text-slate-600">No tools available yet. Failed runs will generate new candidates.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={{
                  id: tool.id,
                  name: tool.name,
                  description: tool.description,
                  usageCount: tool.usageCount,
                  reliabilityScore: tool.reliabilityScore,
                  currentVersionId: tool.currentVersionId,
                }}
                workflows={workflows.items.map((workflow) => ({
                  id: workflow.id,
                  name: workflow.name,
                }))}
              />
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
