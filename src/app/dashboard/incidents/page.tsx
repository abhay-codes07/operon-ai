import { IncidentCenterTable } from "@/components/dashboard/incidents/incident-center-table";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { listIncidentsByOrganization } from "@/lib/sla/incident.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardIncidentsPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const incidents = await listIncidentsByOrganization(user.organizationId!);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Incident Center"
        title="SLA Breach Operations"
        description="Track breaches, inspect details, retry runs, and resolve incidents."
      />
      <DashboardCard>
        <IncidentCenterTable
          items={incidents.map((item) => ({
            id: item.id,
            workflowId: item.workflowId,
            workflowName: item.workflow.name,
            runId: item.runId,
            breachType: item.breachType,
            detectedAt: item.detectedAt.toISOString(),
            resolvedAt: item.resolvedAt?.toISOString(),
          }))}
        />
      </DashboardCard>
    </div>
  );
}
