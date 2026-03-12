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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Live Browser View</h2>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">Workflow: {session?.workflow.name ?? "Loading..."}</p>
          <p className="text-sm text-slate-700">Run status: {session?.run.status ?? "Loading..."}</p>
          <p className="text-sm text-slate-700">Interventions: {session?.interventions.length ?? 0}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Intervention Timeline</h2>
        <div className="mt-3 space-y-2">
          {session?.interventions.length ? null : <p className="text-sm text-slate-600">No interventions yet.</p>}
          {session?.interventions.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">
                {item.stepId} • {item.interventionType}
              </p>
              <p className="text-xs text-slate-600">
                confidence {Math.round(item.agentConfidence * 100)}% • suggested {item.agentSuggestedAction}
              </p>
              <p className="text-xs text-slate-600">human action: {item.humanAction}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
