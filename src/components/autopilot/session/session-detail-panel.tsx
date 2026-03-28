type ActionItem = {
  id: string;
  actionType: string;
  selector: string | null;
  value: string | null;
  timestamp: string;
};

type RepairItem = {
  id: string;
  strategy: string;
  failedSelector: string | null;
  repairedSelector: string | null;
  confidence: number;
  success: boolean;
  createdAt: string;
};

type SessionDetailPanelProps = {
  domain: string;
  status: string;
  workflowFingerprint: string | null;
  startedAt: string;
  completedAt: string | null;
  actions: ActionItem[];
  repairs: RepairItem[];
};

export function SessionDetailPanel(props: SessionDetailPanelProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-5 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">Session Overview</h2>
        <p className="mt-1 text-sm text-slate-400">
          {props.domain} • {props.status}
        </p>
        <p className="text-xs text-slate-500">Fingerprint {props.workflowFingerprint ?? "n/a"}</p>
        <p className="text-xs text-slate-500">
          Started {new Date(props.startedAt).toLocaleString()}
          {props.completedAt ? ` • Completed ${new Date(props.completedAt).toLocaleString()}` : ""}
        </p>
      </section>

      <section className="rounded-2xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-5 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">Captured Actions</h2>
        <div className="mt-3 space-y-2">
          {props.actions.length === 0 ? <p className="text-sm text-slate-400">No actions captured.</p> : null}
          {props.actions.map((action) => (
            <article key={action.id} className="rounded-lg border border-[#1e2d5a]/60 bg-[#060b18]/60 p-3">
              <p className="text-sm font-semibold text-white">{action.actionType}</p>
              <p className="text-xs text-slate-400">
                {action.selector ?? "n/a"} {action.value ? `• ${action.value}` : ""}
              </p>
              <p className="text-xs text-slate-500">{new Date(action.timestamp).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-5 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">Repair Events</h2>
        <div className="mt-3 space-y-2">
          {props.repairs.length === 0 ? <p className="text-sm text-slate-400">No repair events.</p> : null}
          {props.repairs.map((repair) => (
            <article key={repair.id} className="rounded-lg border border-[#1e2d5a]/60 bg-[#060b18]/60 p-3">
              <p className="text-sm font-semibold text-white">{repair.strategy}</p>
              <p className="text-xs text-slate-400">
                {repair.failedSelector ?? "n/a"} → {repair.repairedSelector ?? "n/a"}
              </p>
              <p className="text-xs text-slate-500">
                Confidence {Math.round(repair.confidence * 100)}% • {repair.success ? "Success" : "Failed"}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
