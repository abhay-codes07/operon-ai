import { DeployAgentModal } from "@/components/dashboard/mission-control/deploy-agent-modal";
import { MissionControlDashboard } from "@/components/dashboard/mission-control/mission-control-dashboard";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { fetchAgentDeploymentState } from "@/server/services/mission-control/deployment-service";
import { fetchMissionFleetDashboard } from "@/server/services/mission-control/fleet-service";
import { fetchIncidentAlerts } from "@/server/services/mission-control/incident-detection-service";
import { fetchOperationalMetrics } from "@/server/services/mission-control/metrics-service";
import {
  ensureMissionControlRunbooks,
  fetchRunbookExecutionHistory,
} from "@/server/services/mission-control/runbook-engine";

export default async function DashboardMissionControlPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("ADMIN");
  await ensureMissionControlRunbooks(user.organizationId!);

  const [fleet, incidents, metrics, deployments, runbookExecutions, agents] = await Promise.all([
    fetchMissionFleetDashboard(user.organizationId!),
    fetchIncidentAlerts(user.organizationId!),
    fetchOperationalMetrics({ organizationId: user.organizationId!, hours: 24 }),
    fetchAgentDeploymentState(user.organizationId!),
    fetchRunbookExecutionHistory(user.organizationId!),
    fetchAgentCatalog({
      organizationId: user.organizationId!,
      page: 1,
      pageSize: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Real-Time Fleet Operations</h1>
        <p className="text-indigo-100 text-lg">Mission Control</p>
        <p className="text-indigo-200 text-sm mt-2">Unified control plane for autonomous web agents, incident response, and recovery runbooks.</p>
      </div>

      {/* Main Dashboard */}
      <MissionControlDashboard
        initialFleet={fleet.fleet.map((item) => ({
          ...item,
          updatedAt: item.updatedAt.toISOString(),
          statusAt: item.statusAt.toISOString(),
          health:
            item.health === null
              ? null
              : {
                  cpuLoadPct: item.health.cpuLoadPct,
                  memoryUsageMb: item.health.memoryUsageMb,
                  queueBacklog: item.health.queueBacklog,
                  successRateWindow: item.health.successRateWindow,
                },
        }))}
        initialIncidents={incidents.map((item) => ({
          ...item,
          detectedAt: item.detectedAt.toISOString(),
          events: item.events.map((event) => ({
            ...event,
            occurredAt: event.occurredAt.toISOString(),
          })),
        }))}
        initialMetrics={{
          runsPerHour: metrics.runsPerHour,
          successRate: metrics.successRate,
          incidentCount: metrics.incidentCount,
          averageExecutionSeconds: metrics.averageExecutionSeconds,
        }}
      />

      {/* Control Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deployment Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Agent Deployment</h2>
              <p className="text-slate-400 text-sm">Deploy or scale agents and monitor rollout state.</p>
            </div>
            <DeployAgentModal
              agents={agents.items.map((agent) => ({
                id: agent.id,
                name: agent.name,
              }))}
            />
          </div>

          {deployments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No agent deployments yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-cyan-500/50 transition-colors">
                  <p className="text-white font-semibold">{deployment.agent.name}</p>
                  <div className="flex gap-4 mt-2 text-sm text-slate-400">
                    <span>🎯 Desired: <span className="text-white font-semibold">{deployment.desiredRuns}</span></span>
                    <span>✓ Actual: <span className="text-white font-semibold">{deployment.actualRuns}</span></span>
                    <span className={`font-semibold ${deployment.status === "ACTIVE" ? "text-green-400" : "text-yellow-400"}`}>{deployment.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Runbooks Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Automated Runbooks</h2>
          <p className="text-slate-400 text-sm mb-6">Recent recovery actions triggered by Mission Control.</p>

          {runbookExecutions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No runbook executions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runbookExecutions.map((item) => (
                <div key={item.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-green-500/50 transition-colors">
                  <p className="text-white font-semibold">{item.runbook.name}</p>
                  <div className="flex gap-4 mt-2 text-sm text-slate-400">
                    <span className={`font-semibold ${item.status === "COMPLETED" ? "text-green-400" : "text-blue-400"}`}>● {item.status}</span>
                    <span className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
