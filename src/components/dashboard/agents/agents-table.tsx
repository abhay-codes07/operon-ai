import { AgentStatusBadge } from "@/components/dashboard/status/agent-status-badge";
import { ReliabilityScoreBadge } from "@/components/dashboard/agents/reliability-score-badge";

type AgentListItem = {
  id: string;
  name: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  reliabilityScore?: number | null;
  createdAt: Date;
};

type AgentsTableProps = {
  agents: AgentListItem[];
};

export function AgentsTable({ agents }: AgentsTableProps): JSX.Element {
  if (agents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">No agents yet</p>
        <p className="mt-1 text-sm text-slate-600">Create your first autonomous web agent to start building workflows.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reliability
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {agents.map((agent) => (
            <tr key={agent.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{agent.name}</p>
                <p className="text-xs text-slate-500">{agent.description ?? "No description"}</p>
              </td>
              <td className="px-4 py-3">
                <AgentStatusBadge status={agent.status} />
              </td>
              <td className="px-4 py-3">
                <ReliabilityScoreBadge score={agent.reliabilityScore} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(agent.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
