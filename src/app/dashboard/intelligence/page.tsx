import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { CompetitorManager } from "@/components/dashboard/intelligence/competitor-manager";
import { IntelligenceTrendBars } from "@/components/dashboard/intelligence/intelligence-trend-bars";
import { listCompetitors } from "@/lib/competitor/competitor.service";
import { generateInsights } from "@/lib/intelligence/insight.service";
import { generateMorningReport } from "@/lib/intelligence/report.service";
import { aggregateSignalsByType, listSignals } from "@/lib/intelligence/signal.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardIntelligencePage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [competitors, signals, trends, insights, report] = await Promise.all([
    listCompetitors(user.organizationId!),
    listSignals(user.organizationId!, 100),
    aggregateSignalsByType(user.organizationId!),
    generateInsights(user.organizationId!),
    generateMorningReport(user.organizationId!),
  ]);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Intelligence"
        title="Autonomous Competitive Intelligence Nerve Center"
        description="Parallel agents monitor competitors and synthesize actionable signals."
      />

      <DashboardCard title="Competitor Coverage">
        <p className="mb-3 text-sm text-slate-700">{competitors.length} competitors monitored</p>
        <CompetitorManager
          initialItems={competitors.map((item) => ({
            id: item.id,
            name: item.name,
            website: item.website,
          }))}
        />
      </DashboardCard>

      <DashboardCard title="Signal Trends">
        <IntelligenceTrendBars items={trends} />
      </DashboardCard>

      <DashboardCard title="Latest Signals">
        <div className="space-y-2">
          {signals.slice(0, 20).map((signal) => (
            <article key={signal.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{signal.competitor.name}</p>
              <p className="text-xs text-slate-600">
                {signal.signalType} • {new Date(signal.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Generated Insights">
        <div className="space-y-2">
          {insights.slice(0, 20).map((insight, index) => (
            <article key={`${insight.competitorId}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
              <p className="text-xs text-slate-600">{insight.competitorName}</p>
            </article>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Morning Briefing">
        <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {report.text}
        </pre>
      </DashboardCard>
    </div>
  );
}
