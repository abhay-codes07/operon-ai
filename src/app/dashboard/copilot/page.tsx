import { CoPilotSessionsTable } from "@/components/dashboard/copilot/copilot-sessions-table";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { listCoPilotSessions } from "@/lib/copilot/session.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardCoPilotPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const sessions = await listCoPilotSessions(user.organizationId!, 50);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operon Co-Pilot"
        title="Human-in-the-Loop Sessions"
        description="Monitor low-confidence handoffs between autonomous agents and human operators."
      />
      <DashboardCard title="Recent Co-Pilot Sessions">
        <CoPilotSessionsTable
          items={sessions.map((session) => ({
            id: session.id,
            startedAt: session.startedAt.toISOString(),
            workflowName: session.workflow.name,
            runStatus: session.run.status,
            interventionCount: session.interventions.length,
          }))}
        />
      </DashboardCard>
    </div>
  );
}
