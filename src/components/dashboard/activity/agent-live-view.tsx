"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type StreamEvent = {
  id?: string;
  sequence: number;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

type AgentLiveViewProps = {
  organizationId: string;
  executionId: string;
  initialEvents: StreamEvent[];
};

const controlActions = [
  { label: "Pause", action: "PAUSE" },
  { label: "Resume", action: "RESUME" },
  { label: "Step", action: "STEP" },
  { label: "Stop", action: "STOP" },
] as const;

export function AgentLiveView({
  organizationId,
  executionId,
  initialEvents,
}: AgentLiveViewProps): JSX.Element {
  const [events, setEvents] = useState(initialEvents);
  const [overrideSelector, setOverrideSelector] = useState("");

  const latestSequence = useMemo(() => events.at(-1)?.sequence ?? 0, [events]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = `${window.location.hostname}:3101`;
    const socket = new WebSocket(
      `${protocol}://${wsHost}/control-plane?organizationId=${organizationId}&executionId=${executionId}`,
    );

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as StreamEvent;
      setEvents((current) => {
        if (current.some((item) => item.sequence === parsed.sequence)) {
          return current;
        }
        return [...current, parsed].sort((a, b) => a.sequence - b.sequence);
      });
    };

    return () => socket.close();
  }, [executionId, organizationId]);

  async function sendCommand(action: "PAUSE" | "RESUME" | "STEP" | "STOP" | "OVERRIDE_ACTION") {
    const payload =
      action === "OVERRIDE_ACTION"
        ? {
            action,
            payload: { selectorOverride: overrideSelector },
          }
        : { action };

    await fetch(`/api/internal/executions/${executionId}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Live Controls</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {controlActions.map((item) => (
            <Button key={item.action} type="button" variant="secondary" onClick={() => sendCommand(item.action)}>
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={overrideSelector}
            onChange={(event) => setOverrideSelector(event.target.value)}
            placeholder="Selector override"
            className="h-10 min-w-[220px] rounded-md border border-slate-300 px-3 text-sm"
          />
          <Button type="button" variant="ghost" onClick={() => sendCommand("OVERRIDE_ACTION")}>
            Override Action
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Live Timeline • Sequence {latestSequence}
          </p>
        </div>
        <ol className="max-h-[520px] overflow-auto divide-y divide-slate-100">
          {events.map((event) => (
            <li key={`${event.sequence}-${event.eventType}`} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{event.eventType}</p>
                <p className="text-xs text-slate-500">#{event.sequence}</p>
              </div>
              <p className="text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString()}</p>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-950 p-2 text-xs text-slate-100">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
