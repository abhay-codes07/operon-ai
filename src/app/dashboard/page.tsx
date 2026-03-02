import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuthenticatedUser } from "@/server/auth/authorization";

export default async function DashboardPage(): Promise<JSX.Element> {
  const user = await requireAuthenticatedUser();

  return (
    <div className="space-y-5">
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
    </div>
  );
}
