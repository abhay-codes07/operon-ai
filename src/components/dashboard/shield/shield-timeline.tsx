"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type TimelineItem = {
  date: string;
  total: number;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
};

type ShieldTimelineProps = {
  initialItems: TimelineItem[];
};

export function ShieldTimeline({ initialItems }: ShieldTimelineProps): JSX.Element {
  const [items, setItems] = useState(initialItems);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/shield/timeline?days=7", {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { items: TimelineItem[] };
    setItems(payload.items);
  }, []);

  usePolling(refresh, 15_000, true);

  if (items.length === 0) {
    return <p className="text-sm text-slate-600">No threat events in the selected time window.</p>;
  }

  const peak = Math.max(...items.map((item) => item.total), 1);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article key={item.date} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-700">{item.date}</p>
            <p className="text-xs text-slate-600">{item.total} events</p>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-rose-500 transition-all"
              style={{
                width: `${Math.max(6, Math.round((item.total / peak) * 100))}%`,
              }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
