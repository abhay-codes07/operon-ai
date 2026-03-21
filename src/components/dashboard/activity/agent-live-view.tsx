"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Radio, Circle, Square, SkipForward, Play, Pause, ChevronRight } from "lucide-react";

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

const eventTypeColor: Record<string, string> = {
  "execution.started": "text-cyan-400",
  "execution.completed": "text-emerald-400",
  "execution.failed": "text-rose-400",
  "execution.stopped": "text-rose-400",
  "execution.paused": "text-amber-400",
  "execution.terminal": "text-emerald-400",
  "step.updated": "text-blue-400",
  "worker.picked": "text-slate-400",
  "worker.failed": "text-rose-400",
  "worker.completed": "text-emerald-400",
  "gateway.blocked": "text-orange-400",
  "approval.pending": "text-yellow-400",
  "copilot.ghost": "text-purple-400",
  "compliance.violation": "text-rose-400",
};

const controlActions = [
  { label: "Pause", action: "PAUSE" as const, icon: Pause },
  { label: "Resume", action: "RESUME" as const, icon: Play },
  { label: "Step", action: "STEP" as const, icon: SkipForward },
  { label: "Stop", action: "STOP" as const, icon: Square },
];

export function AgentLiveView({
  organizationId: _organizationId,
  executionId,
  initialEvents,
}: AgentLiveViewProps): JSX.Element {
  const [events, setEvents] = useState(initialEvents);
  const [overrideSelector, setOverrideSelector] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [isTerminal, setIsTerminal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latestSequence = useMemo(() => events.at(-1)?.sequence ?? 0, [events]);

  // SSE connection
  useEffect(() => {
    const es = new EventSource(`/api/internal/executions/${executionId}/sse`);

    es.onmessage = (e: MessageEvent) => {
      const parsed = JSON.parse(e.data as string) as StreamEvent;

      if ((parsed as { eventType?: string }).eventType === "execution.terminal") {
        setIsTerminal(true);
        setIsLive(false);
        es.close();
        return;
      }

      setEvents((current) => {
        if (current.some((item) => item.sequence === parsed.sequence)) return current;
        return [...current, parsed].sort((a, b) => a.sequence - b.sequence);
      });
    };

    es.onerror = () => {
      setIsLive(false);
    };

    return () => es.close();
  }, [executionId]);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  async function sendCommand(action: "PAUSE" | "RESUME" | "STEP" | "STOP" | "OVERRIDE_ACTION") {
    const body =
      action === "OVERRIDE_ACTION"
        ? { action, payload: { selectorOverride: overrideSelector } }
        : { action };

    await fetch(`/api/internal/executions/${executionId}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
        <div className="flex items-center gap-2">
          {isTerminal ? (
            <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
          ) : isLive ? (
            <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          ) : (
            <Circle className="h-3 w-3 fill-slate-600 text-slate-600" />
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {isTerminal ? "Execution Finished" : isLive ? "Live" : "Disconnected"}
          </span>
        </div>
        <span className="text-xs text-slate-600">•</span>
        <span className="text-xs text-slate-500">
          {events.length} event{events.length !== 1 ? "s" : ""} • seq #{latestSequence}
        </span>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Live Controls</p>
        <div className="flex flex-wrap items-center gap-2">
          {controlActions.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => sendCommand(item.action)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={overrideSelector}
            onChange={(e) => setOverrideSelector(e.target.value)}
            placeholder="CSS selector override..."
            className="h-9 min-w-[220px] rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500/60 focus:outline-none"
          />
          <Button type="button" variant="secondary" onClick={() => sendCommand("OVERRIDE_ACTION")}>
            Override Action
          </Button>
        </div>
      </div>

      {/* Event stream */}
      <div className="overflow-hidden rounded-xl border border-slate-700/60">
        <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Live Event Stream
          </p>
          <span className="text-xs text-slate-600">{events.length} events</span>
        </div>
        <ol className="max-h-[520px] divide-y divide-slate-700/40 overflow-auto bg-slate-900/40">
          {events.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">Waiting for events...</li>
          ) : (
            events.map((event) => {
              const color = eventTypeColor[event.eventType] ?? "text-slate-400";
              return (
                <li key={`${event.sequence}-${event.eventType}`} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`h-3 w-3 shrink-0 ${color}`} />
                    <p className={`text-sm font-semibold ${color}`}>{event.eventType}</p>
                    <span className="ml-auto font-mono text-xs text-slate-600">#{event.sequence}</span>
                  </div>
                  <p className="ml-5 mt-0.5 text-xs text-slate-600">
                    {new Date(event.occurredAt).toLocaleTimeString()}
                  </p>
                  {Object.keys(event.payload ?? {}).length > 0 && (
                    <details className="ml-5 mt-1">
                      <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
                        payload
                      </summary>
                      <pre className="mt-1 max-h-32 overflow-auto rounded border border-slate-700/60 bg-slate-950/60 p-2 text-xs text-slate-400">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </li>
              );
            })
          )}
          <div ref={bottomRef} />
        </ol>
      </div>
    </div>
  );
}
