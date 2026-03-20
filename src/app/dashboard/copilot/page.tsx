import { CoPilotSessionsTable } from "@/components/dashboard/copilot/copilot-sessions-table";
import { CoPilotLiveSummary } from "@/components/dashboard/copilot/copilot-live-summary";
import { listCoPilotSessions } from "@/lib/copilot/session.service";
import { getCoPilotSummary } from "@/lib/copilot/summary.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardCoPilotPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [sessions, summary] = await Promise.all([
    listCoPilotSessions(user.organizationId!, 50),
    getCoPilotSummary(user.organizationId!),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Operon Co-Pilot</h1>
        <p className="text-green-100 text-lg">Human-in-the-Loop Sessions</p>
        <p className="text-green-200 text-sm mt-2">Monitor low-confidence handoffs between autonomous agents and human operators.</p>
      </div>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Co-Pilot Sessions</h2>
        <div className="mb-6">
          <CoPilotLiveSummary initial={summary} />
        </div>
        <CoPilotSessionsTable
          items={sessions.map((session) => ({
            id: session.id,
            startedAt: session.startedAt.toISOString(),
            workflowName: session.workflow.name,
            runStatus: session.run.status,
            interventionCount: session.interventions.length,
          }))}
        />
      </div>
    </div>
  );
}
