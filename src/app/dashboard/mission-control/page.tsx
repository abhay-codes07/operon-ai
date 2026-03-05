import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { DeployAgentModal } from "@/components/dashboard/mission-control/deploy-agent-modal";
import { MissionControlDashboard } from "@/components/dashboard/mission-control/mission-control-dashboard";
import { SectionHeading } from "@/components/ui/section-heading";
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
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Mission Control"
        title="Real-Time Fleet Operations"
        description="Unified control plane for autonomous web agents, incident response, and recovery runbooks."
      />

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

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Agent Deployment Interface"
          description="Deploy or scale agents and monitor rollout state."
          action={
            <DeployAgentModal
              agents={agents.items.map((agent) => ({
                id: agent.id,
                name: agent.name,
              }))}
            />
          }
        >
          {deployments.length === 0 ? (
            <p className="text-sm text-slate-600">No agent deployments yet.</p>
          ) : (
            <div className="space-y-2">
              {deployments.map((deployment) => (
                <article key={deployment.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{deployment.agent.name}</p>
                  <p className="text-xs text-slate-600">
                    Desired {deployment.desiredRuns} • Actual {deployment.actualRuns} • {deployment.status}
                  </p>
                </article>
              ))}
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Automated Runbooks" description="Recent recovery actions triggered by Mission Control.">
          {runbookExecutions.length === 0 ? (
            <p className="text-sm text-slate-600">No runbook executions yet.</p>
          ) : (
            <div className="space-y-2">
              {runbookExecutions.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.runbook.name}</p>
                  <p className="text-xs text-slate-600">
                    {item.status} • {new Date(item.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
