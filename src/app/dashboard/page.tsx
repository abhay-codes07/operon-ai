import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ErrorPanel } from "@/components/ui/feedback/error-panel";
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
    <div className="space-y-5">
      {hasRoleError ? (
        <ErrorPanel
          title="Insufficient permissions"
          description="Your current role cannot access the requested resource. Contact an organization owner to upgrade access."
        />
      ) : null}

      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-7 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-green-400">All Systems Operational</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{user.name || "Team"}</span>
          </h1>
          <p className="text-slate-400 text-sm">Your autonomous agent ecosystem is performing optimally.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard/agents"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              View Agents
            </Link>
            <Link
              href="/dashboard/activity"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/60 border border-slate-600/60 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Live Activity
            </Link>
            <Link
              href="/dashboard/control-plane"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/60 border border-slate-600/60 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Control Plane
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] hover:border-cyan-500/40 transition-all">
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-cyan-500/10 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Active Agents</p>
          <p className="mt-2 text-3xl font-bold text-cyan-400 tabular-nums">{metrics?.activeAgents ?? "—"}</p>
          <p className="mt-1.5 text-[11px] text-slate-600">
            {metrics?.activeAgentsChange ? (
              <span className="text-emerald-400">↑ {metrics.activeAgentsChange}% this week</span>
            ) : (
              "No recent activity"
            )}
          </p>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] hover:border-blue-500/40 transition-all">
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/10 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Daily Executions</p>
          <p className="mt-2 text-3xl font-bold text-blue-400 tabular-nums">{metrics?.dailyExecutions ?? "—"}</p>
          <p className="mt-1.5 text-[11px] text-slate-600">
            {metrics?.executionChange != null ? (
              <span className={metrics.executionChange > 0 ? "text-emerald-400" : "text-rose-400"}>
                {metrics.executionChange > 0 ? "↑" : "↓"} {Math.abs(metrics.executionChange)}% from yesterday
              </span>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] hover:border-emerald-500/40 transition-all">
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Success Rate</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400 tabular-nums">{metrics?.successRate ?? "—"}{metrics?.successRate != null ? "%" : ""}</p>
          <p className="mt-1.5 text-[11px] text-slate-600">
            {metrics?.successRate != null ? (
              <span className={metrics.successRate > 90 ? "text-emerald-400" : "text-amber-400"}>
                {metrics.successRate > 90 ? "Excellent performance" : "Monitor closely"}
              </span>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] hover:border-purple-500/40 transition-all">
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-500/10 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Avg Runtime</p>
          <p className="mt-2 text-3xl font-bold text-purple-400 tabular-nums">{metrics?.avgRuntime ?? "—"}</p>
          <p className="mt-1.5 text-[11px] text-slate-600">
            {metrics?.avgRuntimeSeconds != null ? (
              <span className={metrics.avgRuntimeSeconds < 300 ? "text-emerald-400" : "text-amber-400"}>
                {metrics.avgRuntimeSeconds < 300 ? "Optimized" : "Review latency"}
              </span>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Workspace Overview */}
      <DashboardCard
        title="Workspace Overview"
        description="Operational baseline for your multi-agent web automation environment."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 hover:border-slate-600 transition-colors">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Organization</p>
            <p className="mt-2 text-sm font-semibold text-white">{user.organizationName ?? "Unassigned"}</p>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 hover:border-slate-600 transition-colors">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Access Level</p>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                {user.role ?? "MEMBER"}
              </span>
            </div>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 hover:border-slate-600 transition-colors">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">System Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
              </span>
              <p className="text-sm font-medium text-emerald-400">All Systems Operational</p>
            </div>
          </article>
        </div>
      </DashboardCard>

      {/* Execution Queue */}
      <DashboardCard title="Execution Operations" description="Real-time queue and processing metrics.">
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { label: "Waiting", value: queueHealth?.counts.waiting ?? "-", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { label: "Active", value: queueHealth?.counts.active ?? "-", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Completed", value: queueHealth?.counts.completed ?? "-", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Failed", value: queueHealth?.counts.failed ?? "-", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
            { label: "Delayed", value: queueHealth?.counts.delayed ?? "-", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          ].map((item) => (
            <article key={item.label} className={`rounded-xl border ${item.border} ${item.bg} p-4`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className={`mt-2 text-2xl font-bold tabular-nums font-mono ${item.color}`}>{item.value}</p>
            </article>
          ))}
        </div>
      </DashboardCard>

      {/* Web Change Radar */}
      <DashboardCard title="Web Change Radar" description="Real-time monitoring of structural drift detection.">
        {changeEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/60 p-8 text-center">
            <p className="text-sm font-medium text-slate-400">No structural drift detected</p>
            <p className="text-xs text-slate-600 mt-1">Your monitored surfaces are stable</p>
          </div>
        ) : (
          <div className="space-y-2">
            {changeEvents.slice(0, 8).map((event) => (
              <article key={event.id} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3.5 hover:bg-slate-800/70 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-200 text-sm truncate">{event.pageSnapshot.url}</p>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${event.severity === "high" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}>
                    {event.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {event.changeType} &middot; {new Date(event.detectedAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </DashboardCard>

      <div className="grid gap-5 md:grid-cols-2">
        {/* OperonHub */}
        <DashboardCard title="OperonHub" description="Top templates by reliability score.">
          <div className="space-y-2">
            {topTemplates.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700/60 p-6 text-center">
                <p className="text-sm text-slate-500">No templates published yet.</p>
              </div>
            ) : (
              topTemplates.items.map((template) => (
                <article key={template.id} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3 hover:bg-slate-800/70 transition-all">
                  <p className="text-sm font-semibold text-white">{template.title}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
                      Reliability <span className="text-emerald-400 font-medium">{template.reliabilityScore.toFixed(1)}</span>
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-[11px] text-slate-500">
                      <span className="text-blue-400 font-medium">{template.installCount}</span> installs
                    </span>
                  </div>
                </article>
              ))
            )}
            <div className="pt-1">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-700/50 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Browse OperonHub →
              </Link>
            </div>
          </div>
        </DashboardCard>

        {/* Compliance Passport */}
        <DashboardCard title="Compliance Passport" description="Workflow approval posture and violations.">
          <div className="grid gap-3 grid-cols-2">
            <article className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/70">Approved</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-400">{approvalCount}</p>
              <p className="mt-0.5 text-[11px] text-emerald-600">workflows</p>
            </article>
            <article className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-500/70">Violations</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-rose-400">{violationCount}</p>
              <p className="mt-0.5 text-[11px] text-rose-600">detected</p>
            </article>
          </div>
          <div className="pt-3">
            <Link
              href="/dashboard/compliance"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-700/50 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Open Compliance Dashboard →
            </Link>
          </div>
        </DashboardCard>
      </div>

      {/* Co-Pilot */}
      <DashboardCard
        title="Operon Co-Pilot"
        description="Route low-confidence steps to human operators without losing runtime context."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 hover:border-slate-600 transition-colors">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Collaboration Mode</p>
            <p className="mt-2 text-sm font-medium text-slate-200">Human-in-the-loop interception active</p>
            <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </article>
          <article className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 hover:border-slate-600 transition-colors">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Session Surface</p>
            <p className="mt-2 text-sm font-medium text-slate-200">Live intervention session dashboard</p>
          </article>
        </div>
        <div className="pt-3">
          <Link
            href="/dashboard/copilot"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-700/50 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Open Co-Pilot Dashboard →
          </Link>
        </div>
      </DashboardCard>
    </div>
  );
}
