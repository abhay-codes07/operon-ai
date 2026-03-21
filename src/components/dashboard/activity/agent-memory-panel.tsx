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

const kindBadge: Record<string, string> = {
  RUN_METADATA: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  PATTERN: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  FAILURE_RESOLUTION: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

export function AgentMemoryPanel({ entries }: AgentMemoryPanelProps): JSX.Element {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No memory context available for this agent.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article key={entry.id} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${kindBadge[entry.kind] ?? "border-slate-700 bg-slate-800 text-slate-400"}`}>
              {entry.kind.replace(/_/g, " ")}
            </span>
            <p className="text-xs text-slate-600">{new Date(entry.updatedAt).toLocaleString()}</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-200">{entry.memoryKey}</p>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-700/60 bg-slate-900/60 p-3 text-xs text-slate-400">
            {JSON.stringify(entry.memoryValue, null, 2)}
          </pre>
          <p className="mt-2 text-xs text-slate-600">
            Confidence: {entry.confidence ? `${Math.round(entry.confidence * 100)}%` : "n/a"}
          </p>
        </article>
      ))}
    </div>
  );
}
