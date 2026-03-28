"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type InterventionItem = {
  id: string;
  stepId: string;
  interventionType: string;
  agentConfidence: number;
  agentSuggestedAction: string;
  humanAction: string;
  timestamp: string;
};

type SessionPayload = {
  session: {
    id: string;
    startedAt: string;
    endedAt: string | null;
    workflow: { id: string; name: string };
    run: { id: string; status: string };
    interventions: InterventionItem[];
  };
};

type CoPilotSessionLiveProps = {
  sessionId: string;
};

export function CoPilotSessionLive({ sessionId }: CoPilotSessionLiveProps) {
  const [payload, setPayload] = useState<SessionPayload | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/copilot/session/${sessionId}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const next = (await response.json()) as SessionPayload;
    setPayload(next);
  }, [sessionId]);

  usePolling(refresh, 5_000, true);

  const session = payload?.session;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-5 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">Live Browser View</h2>
        <div className="mt-3 rounded-xl border border-[#1e2d5a]/60 bg-[#060b18]/60 p-4">
          <p className="text-sm text-slate-300">Workflow: {session?.workflow.name ?? "Loading..."}</p>
          <p className="text-sm text-slate-300">Run status: {session?.run.status ?? "Loading..."}</p>
          <p className="text-sm text-slate-300">Interventions: {session?.interventions.length ?? 0}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-5 backdrop-blur-sm">
        <h2 className="text-base font-semibold text-white">Intervention Timeline</h2>
        <div className="mt-3 space-y-2">
          {session?.interventions.length ? null : <p className="text-sm text-slate-400">No interventions yet.</p>}
          {session?.interventions.map((item) => (
            <article key={item.id} className="rounded-lg border border-[#1e2d5a]/60 bg-[#060b18]/60 p-3">
              <p className="text-sm font-semibold text-white">
                {item.stepId} • {item.interventionType}
              </p>
              <p className="text-xs text-slate-400">
                confidence {Math.round(item.agentConfidence * 100)}% • suggested {item.agentSuggestedAction}
              </p>
              <p className="text-xs text-slate-400">human action: {item.humanAction}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
