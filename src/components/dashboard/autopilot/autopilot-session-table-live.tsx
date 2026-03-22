"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type SessionItem = {
  id: string;
  domain: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  actions: Array<{ id: string }>;
};

type SessionPayload = {
  items: SessionItem[];
  total: number;
  page: number;
  pageSize: number;
};

const statusOptions = ["ALL", "RECORDING", "REVIEW", "APPROVED", "COMPLETED", "FAILED"] as const;
type StatusOption = (typeof statusOptions)[number];

export function AutopilotSessionTableLive() {
  const [status, setStatus] = useState<StatusOption>("ALL");
  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", pageSize: "15" });
    if (status !== "ALL") {
      params.set("status", status);
    }
    const response = await fetch(`/api/autopilot/sessions?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as SessionPayload;
    setItems(payload.items);
    setLoading(false);
  }, [status]);

  usePolling(refresh, 10_000, true);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatus(option)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              status === option ? "border-slate-700 bg-slate-800 text-white" : "border-slate-700/60 text-slate-300"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {loading ? <p className="text-sm text-slate-400">Loading sessions...</p> : null}
      <div className="space-y-2">
        {items.map((session) => (
          <article key={session.id} className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{session.domain}</p>
                <p className="text-xs text-slate-400">
                  {session.status} • {session.actions.length} actions
                </p>
              </div>
              <Link href={`/autopilot/sessions/${session.id}`} className="text-xs font-semibold text-slate-300 underline">
                View
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
