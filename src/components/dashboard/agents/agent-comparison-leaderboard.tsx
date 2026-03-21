"use client";

type LeaderboardEntry = {
  rank: number;
  agentId: string;
  agentName: string;
  agentStatus: string;
  reliabilityScore: number;
  successRate: number;
  totalExecutions: number;
  avgExecutionMs: number;
  failureFrequency: number;
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="tabular-nums text-xs text-slate-300">{value.toFixed(1)}%</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-400/20 text-xs font-bold text-slate-300">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-700/20 text-xs font-bold text-orange-400">
        3
      </span>
    );
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-500">
      {rank}
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AgentComparisonLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-slate-500">No execution data yet. Run some workflows to populate the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-700/60 bg-slate-900/60">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">#</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Agent</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Score</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Success Rate</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Avg Duration</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Runs</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {entries.map((entry) => {
            const scoreColor =
              entry.reliabilityScore >= 80
                ? "bg-emerald-500"
                : entry.reliabilityScore >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500";
            const successColor =
              entry.successRate * 100 >= 80
                ? "bg-cyan-500"
                : entry.successRate * 100 >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500";

            return (
              <tr key={entry.agentId} className="transition-colors hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-200">{entry.agentName}</p>
                  <p className="font-mono text-xs text-slate-600">{entry.agentId.slice(-8)}</p>
                </td>
                <td className="px-4 py-3">
                  <ScoreBar value={entry.reliabilityScore} color={scoreColor} />
                </td>
                <td className="px-4 py-3">
                  <ScoreBar value={entry.successRate * 100} color={successColor} />
                </td>
                <td className="px-4 py-3">
                  <span className="tabular-nums text-sm text-slate-300">{formatDuration(entry.avgExecutionMs)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="tabular-nums text-sm text-slate-300">{entry.totalExecutions}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      entry.agentStatus === "ACTIVE"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : entry.agentStatus === "PAUSED"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-slate-600/40 bg-slate-800/40 text-slate-500"
                    }`}
                  >
                    {entry.agentStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
