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
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current Plan</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{summary.subscription.plan}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Subscription Status</p>
            <div className="mt-2">
              <StatusBadge label={summary.subscription.status} variant="neutral" />
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Execution Usage (month)</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{usageQuantity}</p>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Upgrade Plans" description="Unlock more monthly executions and advanced operational headroom.">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Starter</p>
            <p className="mt-1 text-sm text-slate-600">Up to 1,000 executions / month</p>
            <div className="mt-4">
              <BillingCheckoutButton plan="STARTER" />
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Growth</p>
            <p className="mt-1 text-sm text-slate-600">Up to 10,000 executions / month</p>
            <div className="mt-4">
              <BillingCheckoutButton plan="GROWTH" />
            </div>
          </article>
        </div>
      </DashboardCard>
    </div>
  );
}
