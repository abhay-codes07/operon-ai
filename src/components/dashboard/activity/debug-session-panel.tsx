"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type DebugSession = {
  id: string;
  notes?: string | null;
  createdAt: string;
};

type DebugSessionPanelProps = {
  executionId: string;
  initialSessions: DebugSession[];
};

export function DebugSessionPanel({
  executionId,
  initialSessions,
}: DebugSessionPanelProps): JSX.Element {
  const [sessions, setSessions] = useState(initialSessions);
  const [selectorPatch, setSelectorPatch] = useState("");

  async function startSession() {
    const response = await fetch(`/api/internal/executions/${executionId}/debug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Live debug attach from dashboard" }),
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { session: { id: string; notes?: string | null; createdAt: string } };
    setSessions((current) => [{ ...payload.session, createdAt: payload.session.createdAt }, ...current]);
  }

  async function patchSession(debugSessionId: string) {
    await fetch(`/api/internal/executions/${executionId}/debug`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        debugSessionId,
        selectorPatch: {
          selector: selectorPatch,
        },
      }),
    });
  }

  async function stopSession(debugSessionId: string) {
    await fetch(`/api/internal/executions/${executionId}/debug`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debugSessionId }),
    });
    setSessions((current) => current.filter((item) => item.id !== debugSessionId));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={startSession}>
          Attach Debugger
        </Button>
        <input
          value={selectorPatch}
          onChange={(event) => setSelectorPatch(event.target.value)}
          placeholder="Selector correction"
          className="h-10 min-w-[220px] rounded-md border border-slate-700/60 bg-slate-800/60 text-white placeholder-slate-500 focus:border-cyan-500/60 focus:ring-cyan-500/30 px-3 text-sm"
        />
      </div>
      {sessions.length === 0 ? <p className="text-sm text-slate-400">No active debug sessions.</p> : null}
      {sessions.map((session) => (
        <article key={session.id} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
          <p className="text-sm font-semibold text-white">Session {session.id.slice(-8)}</p>
          <p className="text-xs text-slate-500">{new Date(session.createdAt).toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => patchSession(session.id)}>
              Apply Selector Patch
            </Button>
            <Button type="button" variant="ghost" onClick={() => stopSession(session.id)}>
              Detach
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
