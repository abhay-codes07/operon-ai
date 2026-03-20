import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ErrorPanel } from "@/components/ui/feedback/error-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { listTemplates } from "@/lib/marketplace/marketplace.service";
import { requireAuthenticatedUser } from "@/server/auth/authorization";
import { fetchChangeRadarFeed } from "@/server/services/monitoring/change-radar-service";
import { getExecutionQueueHealth } from "@/server/queue/monitoring/health";
import { fetchDashboardMetrics } from "@/server/services/dashboard/metrics-service";
import { prisma } from "@/server/db/client";

type DashboardPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps): Promise<JSX.Element> {
  const user = await requireAuthenticatedUser();
  const hasRoleError = searchParams?.error === "insufficient-role";
  const queueHealth = await getExecutionQueueHealth().catch(() => null);
  const changeEvents = user.organizationId
    ? await fetchChangeRadarFeed(user.organizationId).catch(() => [])
    : [];
  const topTemplates = await listTemplates({
    page: 1,
    pageSize: 5,
  }).catch(() => ({ items: [] as Array<{ id: string; title: string; reliabilityScore: number; installCount: number }> }));
  const metrics = user.organizationId ? await fetchDashboardMetrics(user.organizationId).catch(() => null) : null;
  const [approvalCount, violationCount] = user.organizationId
    ? await Promise.all([
        prisma.workflowComplianceApproval.count({
          where: {
            organizationId: user.organizationId,
            revokedAt: null,
          },
        }),
        prisma.complianceViolation.count({
          where: {
            organizationId: user.organizationId,
          },
        }),
      ])
    : [0, 0];

  return (
    <div className="space-y-6">
      {hasRoleError ? (
        <ErrorPanel
          title="Insufficient permissions"
          description="Your current role cannot access the requested resource. Contact an organization owner to upgrade access."
        />
      ) : null}

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name || "Team"}!</h1>
        <p className="text-blue-100">Your autonomous agent ecosystem is performing optimally</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
          <p className="text-slate-400 text-sm font-semibold">Active Agents</p>
          <p className="text-4xl font-bold text-cyan-400 mt-2">{metrics?.activeAgents ?? "—"}</p>
          <p className="text-slate-500 text-xs mt-2">{metrics?.activeAgentsChange ? `↑ ${metrics.activeAgentsChange}% this week` : "No recent activity"}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
          <p className="text-slate-400 text-sm font-semibold">Daily Executions</p>
          <p className="text-4xl font-bold text-blue-400 mt-2">{metrics?.dailyExecutions ?? "—"}</p>
          <p className="text-slate-500 text-xs mt-2">{metrics?.executionChange ? `${metrics.executionChange > 0 ? '↑' : '↓'} ${Math.abs(metrics.executionChange)}% from yesterday` : "—"}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
          <p className="text-slate-400 text-sm font-semibold">Success Rate</p>
          <p className="text-4xl font-bold text-green-400 mt-2">{metrics?.successRate ?? "—"}%</p>
          <p className="text-slate-500 text-xs mt-2">{metrics?.successRate && metrics.successRate > 90 ? "Excellent performance" : "Monitor closely"}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
          <p className="text-slate-400 text-sm font-semibold">Avg Runtime</p>
          <p className="text-4xl font-bold text-purple-400 mt-2">{metrics?.avgRuntime ?? "—"}</p>
          <p className="text-slate-500 text-xs mt-2">{metrics?.avgRuntimeSeconds && metrics.avgRuntimeSeconds < 300 ? "Optimized performance" : "—"}</p>
        </div>
      </div>

      <DashboardCard
        title="Workspace Overview"
        description="Operational baseline for your multi-agent web automation environment."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Organization</p>
            <p className="mt-2 text-lg font-semibold text-white">{user.organizationName ?? "Unassigned"}</p>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Access Level</p>
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {user.role ?? "MEMBER"}
              </span>
            </div>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">System Status</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-green-400">All Systems Operational</p>
            </div>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Execution Operations" description="Real-time queue and processing metrics.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs text-slate-400 font-semibold">Waiting</p>
            <p className="mt-3 text-3xl font-bold text-cyan-400 font-mono">
              {queueHealth?.counts.waiting ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs text-slate-400 font-semibold">Active</p>
            <p className="mt-3 text-3xl font-bold text-blue-400 font-mono">
              {queueHealth?.counts.active ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs text-slate-400 font-semibold">Completed</p>
            <p className="mt-3 text-3xl font-bold text-green-400 font-mono">
              {queueHealth?.counts.completed ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs text-slate-400 font-semibold">Failed</p>
            <p className="mt-3 text-3xl font-bold text-red-400 font-mono">
              {queueHealth?.counts.failed ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 hover:border-cyan-500/50 transition-all">
            <p className="text-xs text-slate-400 font-semibold">Delayed</p>
            <p className="mt-3 text-3xl font-bold text-purple-400 font-mono">
              {queueHealth?.counts.delayed ?? "-"}
            </p>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Web Change Radar" description="Real-time monitoring of structural drift detection.">
        {changeEvents.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-700/50 p-8 text-center">
            <p className="text-slate-400">✨ No structural drift detected in recent executions.</p>
            <p className="text-sm text-slate-500 mt-2">Your monitored surfaces are stable</p>
          </div>
        ) : (
          <div className="space-y-2">
            {changeEvents.slice(0, 8).map((event) => (
              <article key={event.id} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 hover:bg-slate-800/50 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{event.pageSnapshot.url}</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${event.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {event.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {event.changeType} • {new Date(event.detectedAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard title="OperonHub" description="Top templates by reliability score in the marketplace.">
        <div className="space-y-2">
          {topTemplates.items.length === 0 ? (
            <p className="text-sm text-slate-600">No templates published yet.</p>
          ) : (
            topTemplates.items.map((template) => (
              <article key={template.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{template.title}</p>
                <p className="text-xs text-slate-600">
                  Reliability {template.reliabilityScore.toFixed(1)} • Installs {template.installCount}
                </p>
              </article>
            ))
          )}
          <div className="pt-2">
            <Link
              href="/marketplace"
              className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white"
            >
              Browse OperonHub
            </Link>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Compliance Passport" description="Workflow approval posture and compliance violations.">
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Approved Workflows</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{approvalCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Compliance Violations</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{violationCount}</p>
          </article>
        </div>
        <div className="pt-3">
          <Link
            href="/dashboard/compliance"
            className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white"
          >
            Open Compliance Dashboard
          </Link>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Operon Co-Pilot"
        description="Route low-confidence steps to human operators without losing runtime context."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Collaboration Mode</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Human-in-the-loop interception active</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Session Surface</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Live intervention session dashboard</p>
          </article>
        </div>
        <div className="pt-3">
          <Link
            href="/dashboard/copilot"
            className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white"
          >
            Open Co-Pilot Dashboard
          </Link>
        </div>
      </DashboardCard>
    </div>
  );
}
