import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { EthicswatchDashboard } from "@/components/dashboard/ethicswatch/ethicswatch-dashboard";

export default async function EthicswatchPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const agentsResult = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    page: 1,
    pageSize: 50,
  }).catch(() => ({ items: [] as Array<{ id: string; name: string }> }));

  const agents = agentsResult.items.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-purple-950/40 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500 mb-1">
          ESG & Ethics Intelligence
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">EthicsWatch</h1>
        <p className="mt-1 text-slate-400 max-w-2xl">
          TinyFish agents continuously monitor corporate CSR pages, SEC EDGAR ESG disclosures,
          regulatory announcements, and UN SDG databases. Get briefed on material changes — not just
          raw data diffs.
        </p>
      </div>

      <EthicswatchDashboard agents={agents} />
    </div>
  );
}
