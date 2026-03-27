import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { SnapbuyDashboard } from "@/components/dashboard/snapbuy/snapbuy-dashboard";

export default async function SnapbuyPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const agentsResult = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    status: "ACTIVE",
    page: 1,
    pageSize: 50,
  }).catch(() => ({ items: [] as Array<{ id: string; name: string }> }));

  const agents = agentsResult.items.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 mb-1">
          Autonomous Commerce
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">SnapBuy</h1>
        <p className="mt-1 text-slate-400 max-w-2xl">
          The web moves faster than you. Now you don&apos;t have to. SnapBuy monitors any product, ticket, or reservation — and the instant conditions are met, it completes the purchase for you.
        </p>
      </div>

      <SnapbuyDashboard agents={agents} />
    </div>
  );
}
