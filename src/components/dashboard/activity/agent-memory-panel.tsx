"use client";

type MemoryEntry = {
  id: string;
  kind: "RUN_METADATA" | "PATTERN" | "FAILURE_RESOLUTION";
  memoryKey: string;
  memoryValue: Record<string, unknown>;
  confidence?: number | null;
  updatedAt: string;
};

type AgentMemoryPanelProps = {
  entries: MemoryEntry[];
};

export function AgentMemoryPanel({ entries }: AgentMemoryPanelProps): JSX.Element {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-600">No memory context available for this agent.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{entry.kind}</p>
            <p className="text-xs text-slate-500">{new Date(entry.updatedAt).toLocaleString()}</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{entry.memoryKey}</p>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(entry.memoryValue, null, 2)}
          </pre>
          <p className="mt-2 text-xs text-slate-500">
            Confidence: {entry.confidence ? `${Math.round(entry.confidence * 100)}%` : "n/a"}
          </p>
        </article>
      ))}
    </div>
  );
}
