type ExecutionLogItem = {
  id: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: Record<string, unknown> | null;
  occurredAt: Date;
};

type ExecutionLogTimelineProps = {
  logs: ExecutionLogItem[];
};

const levelColor = {
  DEBUG: "text-slate-500",
  INFO: "text-cyan-400",
  WARN: "text-amber-400",
  ERROR: "text-rose-400",
} as const;

const levelBorder = {
  DEBUG: "border-slate-700/60",
  INFO: "border-slate-700/60",
  WARN: "border-amber-500/30",
  ERROR: "border-rose-500/30",
} as const;

const levelBg = {
  DEBUG: "bg-slate-800/40",
  INFO: "bg-slate-800/40",
  WARN: "bg-amber-500/5",
  ERROR: "bg-rose-500/5",
} as const;

const levelDot = {
  DEBUG: "bg-slate-600",
  INFO: "bg-cyan-500",
  WARN: "bg-amber-500",
  ERROR: "bg-rose-500",
} as const;

export function ExecutionLogTimeline({ logs }: ExecutionLogTimelineProps): JSX.Element {
  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">No logs available for selected execution.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <article
          key={log.id}
          className={`grid grid-cols-[100px,1fr] gap-3 rounded-lg border p-3 ${levelBorder[log.level]} ${levelBg[log.level]}`}
        >
          <div className="text-xs text-slate-600 tabular-nums">
            {new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            }).format(log.occurredAt)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${levelDot[log.level]}`} />
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${levelColor[log.level]}`}>{log.level}</p>
            </div>
            <p className="mt-1 text-sm text-slate-300">{log.message}</p>
            {log.metadata ? (
              <details className="mt-2 rounded-lg border border-slate-700/60 bg-slate-900/60">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300">
                  Metadata
                </summary>
                <pre className="overflow-auto px-3 pb-3 text-[11px] text-slate-400">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
