import { AddSentinelButton } from "@/components/dashboard/sentinels/add-sentinel-modal";
import { SentinelGrid } from "@/components/dashboard/sentinels/sentinel-grid";
import type { SentinelCardData } from "@/components/dashboard/sentinels/sentinel-grid";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { listSentinels } from "@/server/services/sentinels/sentinel-service";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";

export default async function DashboardSentinelsPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const [sentinelsRaw, agentsResult] = await Promise.all([
    listSentinels(user.organizationId!),
    fetchAgentCatalog({ organizationId: user.organizationId!, page: 1, pageSize: 100 }),
  ]);

  // Map service output to the card data shape expected by SentinelGrid
  const sentinels: SentinelCardData[] = sentinelsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    watchUrl: s.definition.watchUrl,
    checkInterval: s.definition.checkInterval,
    status: s.hasRecentChange ? "change_detected" : "watching",
    lastChecked: s.latestSnapshot?.capturedAt.toISOString() ?? null,
    changeCount: s.changeCount,
    lastBriefing: s.definition.lastBriefing,
  }));

  const agents = agentsResult.items.map((a) => ({
    id: a.id,
    name: a.name,
  }));

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            Web Intelligence
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Sentinel Watchlist
          </h1>
          <p className="max-w-2xl text-sm text-slate-400 md:text-base">
            Always-on AI agents monitoring the web for meaningful changes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddSentinelButton agents={agents} />
        </div>
      </header>

      {/* Stats bar */}
      {sentinels.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
            <p className="text-xs text-slate-500">Total Sentinels</p>
            <p className="mt-0.5 text-2xl font-semibold text-white">
              {sentinels.length}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs text-slate-500">Watching</p>
            <p className="mt-0.5 text-2xl font-semibold text-emerald-400">
              {sentinels.filter((s) => s.status === "watching").length}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-slate-500">Change Detected</p>
            <p className="mt-0.5 text-2xl font-semibold text-amber-400">
              {sentinels.filter((s) => s.status === "change_detected").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
            <p className="text-xs text-slate-500">Total Changes</p>
            <p className="mt-0.5 text-2xl font-semibold text-white">
              {sentinels.reduce((sum, s) => sum + s.changeCount, 0)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Sentinel grid */}
      <SentinelGrid sentinels={sentinels} />
    </div>
  );
}
