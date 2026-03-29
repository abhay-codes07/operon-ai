import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { PricewatchDashboard } from "@/components/dashboard/pricewatch/pricewatch-dashboard";

export default async function PricewatchPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const agentsResult = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    page: 1,
    pageSize: 50,
  }).catch(() => ({ items: [] as Array<{ id: string; name: string }> }));

  const agents = agentsResult.items.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 mb-1">
          Price Intelligence
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">PriceWatch</h1>
        <p className="mt-1 text-slate-400 max-w-2xl">
          TinyFish agents monitor any product 24/7. The moment the price drops below your target,
          you&apos;ll get an email and Slack alert instantly — so you can act before the deal disappears.
        </p>
      </div>

      <PricewatchDashboard agents={agents} />
    </div>
  );
}
