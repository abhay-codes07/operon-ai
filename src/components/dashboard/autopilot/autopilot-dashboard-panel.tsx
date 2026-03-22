import Link from "next/link";

type SessionItem = {
  id: string;
  domain: string;
  status: string;
  startedAt: string;
  actions: number;
  userLabel: string;
};

type MemoryItem = {
  id: string;
  domain: string;
  reliabilityScore: number;
  selectorCount: number;
  pathCount: number;
  updatedAt: string;
};

type RepairItem = {
  id: string;
  runId: string;
  occurredAt: string;
  workflowName: string | null;
  strategy: string | null;
  failedSelector: string | null;
  repairedSelector: string | null;
};

type AutopilotDashboardPanelProps = {
  sessions: SessionItem[];
  memories: MemoryItem[];
  repairs: RepairItem[];
};

export function AutopilotDashboardPanel({ sessions, memories, repairs }: AutopilotDashboardPanelProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900 p-5 shadow-sm lg:col-span-1">
        <h2 className="text-base font-semibold text-white">Learned Workflows</h2>
        <div className="mt-3 space-y-2">
          {sessions.length === 0 ? <p className="text-sm text-slate-400">No sessions yet.</p> : null}
          {sessions.map((session) => (
            <article key={session.id} className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
              <p className="text-sm font-semibold text-white">{session.domain}</p>
              <p className="text-xs text-slate-400">
                {session.status} • {session.actions} actions
              </p>
              <p className="text-xs text-slate-500">{session.userLabel}</p>
              <p className="text-xs text-slate-500">{new Date(session.startedAt).toLocaleString()}</p>
              <Link href={`/autopilot/sessions/${session.id}`} className="text-xs font-semibold text-slate-300 underline">
                Open session
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900 p-5 shadow-sm lg:col-span-1">
        <h2 className="text-base font-semibold text-white">Domain Memory</h2>
        <div className="mt-3 space-y-2">
          {memories.length === 0 ? <p className="text-sm text-slate-400">No domain memory snapshots yet.</p> : null}
          {memories.map((memory) => (
            <article key={memory.id} className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
              <p className="text-sm font-semibold text-white">{memory.domain}</p>
              <p className="text-xs text-slate-400">
                Reliability {Math.round(memory.reliabilityScore * 100)}% • Selectors {memory.selectorCount}
              </p>
              <p className="text-xs text-slate-500">Paths {memory.pathCount}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900 p-5 shadow-sm lg:col-span-1">
        <h2 className="text-base font-semibold text-white">Repair Events</h2>
        <div className="mt-3 space-y-2">
          {repairs.length === 0 ? <p className="text-sm text-slate-400">No repair events recorded.</p> : null}
          {repairs.map((repair) => (
            <article key={repair.id} className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
              <p className="text-sm font-semibold text-white">{repair.workflowName ?? "Unlinked workflow"}</p>
              <p className="text-xs text-slate-400">
                {repair.strategy ?? "unknown"} • {repair.failedSelector ?? "n/a"} → {repair.repairedSelector ?? "n/a"}
              </p>
              <p className="text-xs text-slate-500">{new Date(repair.occurredAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
