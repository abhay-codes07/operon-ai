import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { HeartbeatDashboard } from "@/components/dashboard/heartbeat/heartbeat-dashboard";

export default async function HeartbeatPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const agentsResult = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    page: 1,
    pageSize: 50,
  }).catch(() => ({ items: [] as Array<{ id: string; name: string }> }));

  const agents = agentsResult.items.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-cyan-950/30 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 mb-1">
          Synthetic Monitoring
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white">Heartbeat</h1>
        <p className="mt-1 text-slate-400 max-w-2xl">
          Synthetic user monitoring powered by real browser agents. Catch broken flows before your customers do. TinyFish understands visual UI — not just HTTP status codes.
        </p>
      </div>

      <HeartbeatDashboard agents={agents} />
    </div>
  );
}
