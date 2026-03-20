import { CompetitorManager } from "@/components/dashboard/intelligence/competitor-manager";
import { IntelligenceAlerts } from "@/components/dashboard/intelligence/intelligence-alerts";
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Autonomous Competitive Intelligence Nerve Center</h1>
        <p className="text-amber-100 text-lg">Intelligence</p>
        <p className="text-amber-200 text-sm mt-2">Parallel agents monitor competitors and synthesize actionable signals.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Competitor Coverage */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Competitor Coverage</h2>
          <p className="text-slate-400 text-sm mb-6">{competitors.length} competitors monitored</p>
          <CompetitorManager
            initialItems={competitors.map((item) => ({
              id: item.id,
              name: item.name,
              website: item.website,
            }))}
          />
        </div>

        {/* Signal Trends */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Signal Trends</h2>
          <IntelligenceTrendBars items={trends} />
        </div>
      </div>

      {/* Latest Signals */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Latest Signals</h2>
        {signals.length === 0 ? (
          <p className="text-slate-500">No signals detected yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {signals.slice(0, 20).map((signal) => (
              <div key={signal.id} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-cyan-500/50 transition-colors">
                <p className="text-white font-semibold">{signal.competitor.name}</p>
                <p className="text-sm text-slate-400 mt-1">📊 {signal.signalType}</p>
                <p className="text-xs text-slate-500 mt-2">{new Date(signal.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated Insights */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Generated Insights</h2>
        {insights.length === 0 ? (
          <p className="text-slate-500">No insights generated yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {insights.slice(0, 20).map((insight, index) => (
              <div key={`${insight.competitorId}-${index}`} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-amber-500/50 transition-colors">
                <p className="text-white font-semibold">{insight.title}</p>
                <p className="text-sm text-slate-400 mt-1">🎯 {insight.competitorName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Priority Alerts</h2>
        <IntelligenceAlerts
          items={insights.slice(0, 10).map((insight, index) => ({
            id: `${insight.competitorId}-${index}`,
            competitorName: insight.competitorName,
            signalType: insight.signalType,
            details: insight.details,
            createdAt: insight.createdAt.toISOString(),
          }))}
        />
      </div>

      {/* Morning Briefing */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-6">📋 Morning Briefing</h2>
        <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 overflow-x-auto">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{report.text}</pre>
        </div>
      </div>
    </div>
  );
}
