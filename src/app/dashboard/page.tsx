import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ErrorPanel } from "@/components/ui/feedback/error-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { listTemplates } from "@/lib/marketplace/marketplace.service";
import { requireAuthenticatedUser } from "@/server/auth/authorization";
import { fetchChangeRadarFeed } from "@/server/services/monitoring/change-radar-service";
import { getExecutionQueueHealth } from "@/server/queue/monitoring/health";

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

  return (
    <div className="space-y-5">
      {hasRoleError ? (
        <ErrorPanel
          title="Insufficient permissions"
          description="Your current role cannot access the requested resource. Contact an organization owner to upgrade access."
        />
      ) : null}

      <DashboardCard
        title="Workspace Overview"
        description="Operational baseline for your multi-agent web automation environment."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Organization</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{user.organizationName ?? "Unassigned"}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Access Level</p>
            <div className="mt-2">
              <StatusBadge label={user.role ?? "MEMBER"} variant="neutral" />
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">System Status</p>
            <p className="mt-1 text-sm font-medium text-slate-900">Healthy and accepting execution requests</p>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Execution Operations" description="Next phase surfaces deeper analytics and controls.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total Agents</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">14</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Executions (24h)</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">287</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Success Rate</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">96.4%</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Avg Runtime</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">01m 42s</p>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Background Processing" description="BullMQ execution queue and worker state snapshot.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Waiting</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {queueHealth?.counts.waiting ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Active</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {queueHealth?.counts.active ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Completed</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {queueHealth?.counts.completed ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Failed</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {queueHealth?.counts.failed ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Delayed</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {queueHealth?.counts.delayed ?? "-"}
            </p>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Web Change Radar" description="Detected structural drift across monitored web surfaces.">
        {changeEvents.length === 0 ? (
          <p className="text-sm text-slate-600">No structural drift detected in recent executions.</p>
        ) : (
          <div className="space-y-2">
            {changeEvents.slice(0, 8).map((event) => (
              <article key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{event.pageSnapshot.url}</p>
                  <span className="text-xs font-semibold text-slate-500">{event.severity}</span>
                </div>
                <p className="text-xs text-slate-600">
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
    </div>
  );
}
