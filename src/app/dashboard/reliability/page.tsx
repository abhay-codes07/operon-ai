import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ReliabilityScoreBadge } from "@/components/dashboard/agents/reliability-score-badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchReliabilityDashboard } from "@/server/services/agents/reliability-service";

export default async function DashboardReliabilityPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const items = await fetchReliabilityDashboard(user.organizationId!);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Agent Reliability"
        title="Trust and Stability Metrics"
        description="Operational trust scorecards derived from execution outcomes and runtime behavior."
      />
      <DashboardCard>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Agent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reliability
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Success Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Retry Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Avg Runtime
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.agentId.slice(-8)}</td>
                  <td className="px-4 py-3">
                    <ReliabilityScoreBadge score={item.reliabilityScore} />
                  </td>
                  <td className="px-4 py-3">{(item.successRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">{(item.retryRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">{Math.round(item.avgExecutionMs / 1000)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
