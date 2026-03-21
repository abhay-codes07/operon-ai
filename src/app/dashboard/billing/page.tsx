import { BillingCheckoutButton } from "@/components/dashboard/billing/billing-checkout-button";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { getBillingSummary } from "@/server/services/billing/summary-service";

export default async function DashboardBillingPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const summary = await getBillingSummary(user.organizationId!);

  const usageQuantity = summary.usage?.quantity ?? 0;

  return (
    <div className="space-y-5">
      <DashboardCard title="Billing & Subscription" description="Manage plan tier, subscription status, and quota utilization.">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current Plan</p>
            <p className="mt-2 text-lg font-semibold text-white">{summary.subscription.plan}</p>
          </article>
          <article className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Subscription Status</p>
            <div className="mt-2">
              <StatusBadge label={summary.subscription.status} variant="neutral" />
            </div>
          </article>
          <article className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Execution Usage (month)</p>
            <p className="mt-2 text-lg font-semibold text-white">{usageQuantity}</p>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Upgrade Plans" description="Unlock more monthly executions and advanced operational headroom.">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-700/60 bg-gradient-to-b from-slate-800/60 to-slate-900/40 p-5">
            <p className="text-sm font-semibold text-white">Starter</p>
            <p className="mt-1 text-sm text-slate-400">Up to 1,000 executions / month</p>
            <div className="mt-4">
              <BillingCheckoutButton plan="STARTER" />
            </div>
          </article>
          <article className="rounded-xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-slate-900/40 p-5">
            <p className="text-sm font-semibold text-white">Growth</p>
            <p className="mt-1 text-sm text-slate-400">Up to 10,000 executions / month</p>
            <div className="mt-4">
              <BillingCheckoutButton plan="GROWTH" />
            </div>
          </article>
        </div>
      </DashboardCard>
    </div>
  );
}
