import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { WorkflowsTable } from "@/components/dashboard/workflows/workflows-table";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchWorkflowCatalog } from "@/server/services/workflows/workflow-service";

export default async function DashboardWorkflowsPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const workflows = await fetchWorkflowCatalog({
    organizationId: user.organizationId!,
    page: 1,
    pageSize: 25,
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Workflow Builder"
        title="Workflow Library"
        description="Design, schedule, and deploy deterministic multi-step browser operations."
      />

      <DashboardCard>
        <WorkflowsTable items={workflows.items} />
      </DashboardCard>
    </div>
  );
}
