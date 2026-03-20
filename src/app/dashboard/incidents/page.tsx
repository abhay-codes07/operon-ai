import { IncidentCenterTable } from "@/components/dashboard/incidents/incident-center-table";
import { listIncidentsByOrganization } from "@/lib/sla/incident.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardIncidentsPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const incidents = await listIncidentsByOrganization(user.organizationId!);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">SLA Breach Operations</h1>
        <p className="text-red-100 text-lg">Incident Center</p>
        <p className="text-red-200 text-sm mt-2">Track breaches, inspect details, retry runs, and resolve incidents.</p>
      </div>

      {/* Incidents Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <IncidentCenterTable
          items={incidents.map((item) => ({
            id: item.id,
            workflowId: item.workflowId,
            workflowName: item.workflow.name,
            runId: item.runId,
            breachType: item.breachType,
            breachDetails: item.breachDetails as Record<string, unknown>,
            detectedAt: item.detectedAt.toISOString(),
            resolvedAt: item.resolvedAt?.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
