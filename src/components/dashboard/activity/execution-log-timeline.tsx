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
  INFO: "text-slate-700",
  WARN: "text-amber-700",
  ERROR: "text-rose-700",
} as const;

const levelBorder = {
  DEBUG: "border-slate-300",
  INFO: "border-slate-300",
  WARN: "border-amber-300",
  ERROR: "border-rose-300",
} as const;

export function ExecutionLogTimeline({ logs }: ExecutionLogTimelineProps): JSX.Element {
  if (logs.length === 0) {
    return <p className="text-sm text-slate-600">No logs available for selected execution.</p>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article
          key={log.id}
          className={`grid grid-cols-[110px,1fr] gap-3 rounded-lg border bg-slate-50 p-3 ${levelBorder[log.level]}`}
        >
          <div className="text-xs text-slate-500">
            {new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            }).format(log.occurredAt)}
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${levelColor[log.level]}`}>{log.level}</p>
            <p className="mt-1 text-sm text-slate-800">{log.message}</p>
            {log.metadata ? (
              <details className="mt-2 rounded-md border border-slate-200 bg-white p-2">
                <summary className="cursor-pointer text-xs font-medium text-slate-600">Metadata</summary>
                <pre className="mt-2 overflow-auto text-[11px] text-slate-700">
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
