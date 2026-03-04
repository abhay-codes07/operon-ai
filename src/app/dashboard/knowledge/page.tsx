import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchKnowledgeGraphSnapshot } from "@/server/services/knowledge/knowledge-graph-service";

export default async function DashboardKnowledgePage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const graph = await fetchKnowledgeGraphSnapshot(user.organizationId!);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Knowledge Graph"
        title="Cross-Agent Domain Intelligence"
        description="Shared domain signals and agent insights captured from live execution behavior."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardCard title="Domain Knowledge" description="Observed domain risk and stability signals">
          <div className="space-y-2">
            {graph.domains.slice(0, 8).map((domain) => (
              <article key={domain.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{domain.domain}</p>
                <p className="text-slate-600">
                  Stability {(domain.stabilityScore * 100).toFixed(0)}% • Issues {domain.issueCount}
                </p>
              </article>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="Shared Signals" description="Recurring execution indicators across agents">
          <div className="space-y-2">
            {graph.signals.slice(0, 8).map((signal) => (
              <article key={signal.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{signal.signalType}</p>
                <p className="text-slate-600">{signal.signalKey}</p>
              </article>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="Agent Insights" description="Learned behavior patterns published by execution outcomes">
          <div className="space-y-2">
            {graph.insights.slice(0, 8).map((insight) => (
              <article key={insight.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{insight.insightType}</p>
                <p className="text-slate-600">{insight.insightKey}</p>
              </article>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
