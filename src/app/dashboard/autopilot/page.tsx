import Link from "next/link";

import { AutopilotDashboardPanel } from "@/components/dashboard/autopilot/autopilot-dashboard-panel";
import { AutopilotLiveSummary } from "@/components/dashboard/autopilot/autopilot-live-summary";
import { AutopilotSessionTableLive } from "@/components/dashboard/autopilot/autopilot-session-table-live";
import {
  getAutopilotSummary,
  listAutopilotRepairEvents,
  listDomainMemories,
  listRecentAutopilotSessions,
} from "@/lib/autopilot/dashboard.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export default async function DashboardAutopilotPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [sessions, memories, repairs, summary] = await Promise.all([
    listRecentAutopilotSessions(user.organizationId!, 30),
    listDomainMemories(user.organizationId!, 30),
    listAutopilotRepairEvents(user.organizationId!, 60),
    getAutopilotSummary(user.organizationId!),
  ]);
  const totalSessions = summary.sessionsByStatus.reduce((sum, item) => sum + item.count, 0);
  const activeSessions = summary.sessionsByStatus
    .filter((item) => item.status === "RECORDING")
    .reduce((sum, item) => sum + item.count, 0);
  const reviewSessions = summary.sessionsByStatus
    .filter((item) => item.status === "REVIEW")
    .reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Operon Autopilot</h1>
        <p className="text-purple-100 text-lg">Learning and Self-Repair Control</p>
        <p className="text-purple-200 text-sm mt-2">Monitor captured sessions, memory quality, and auto-repair activity.</p>
      </div>

      {/* Learn Mode Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Learn Mode</h2>
            <p className="text-slate-400">Capture a workflow from live interactions and compile it into a reusable, editable runbook.</p>
          </div>
          <Link href="/autopilot/learn" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105">
            Open Learn Mode
          </Link>
        </div>
        <div className="mb-6">
          <AutopilotLiveSummary
            initial={{
              totalSessions,
              activeSessions,
              reviewSessions,
              repairEvents: summary.repairEventCount,
              averageRepairConfidence: summary.repairConfidenceAvg,
            }}
          />
        </div>
        <AutopilotDashboardPanel
          sessions={sessions.map((session) => ({
            id: session.id,
            domain: session.domain,
            status: session.status,
            startedAt: session.startedAt.toISOString(),
            actions: session.actions.length,
            userLabel: session.user.name || session.user.email || session.user.id,
          }))}
          memories={memories.map((memory) => ({
            id: memory.id,
            domain: memory.domain,
            reliabilityScore: memory.reliabilityScore,
            selectorCount: toStringArray(memory.selectorPatterns).length,
            pathCount: toStringArray(memory.navigationPatterns).length,
            updatedAt: memory.updatedAt.toISOString(),
          }))}
          repairs={repairs.map((repair) => {
            const metadata =
              repair.metadata && typeof repair.metadata === "object"
                ? (repair.metadata as Record<string, unknown>)
                : {};

            return {
              id: repair.id,
              runId: repair.runId,
              occurredAt: repair.occurredAt.toISOString(),
              workflowName: repair.workflow?.name ?? null,
              strategy: typeof metadata.strategy === "string" ? metadata.strategy : null,
              failedSelector: typeof metadata.failedSelector === "string" ? metadata.failedSelector : null,
              repairedSelector: typeof metadata.repairedSelector === "string" ? metadata.repairedSelector : null,
            };
          })}
        />
      </div>

      {/* Session Monitor Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Session Monitor</h2>
        <p className="text-slate-400 mb-6">Live filtered view of Autopilot session states.</p>
        <AutopilotSessionTableLive />
      </div>
    </div>
  );
}
