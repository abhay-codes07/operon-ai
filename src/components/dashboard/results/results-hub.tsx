"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  Zap,
  Filter,
} from "lucide-react";

type OutputItem = { site?: string; name?: string; price?: string | number; url?: string; title?: string; company?: string; location?: string; [k: string]: unknown };

type RunResult = {
  id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  trigger: string;
  agentId: string;
  agentName: string | null;
  workflowId: string | null;
  workflowName: string | null;
  errorMessage: string | null;
  outputPayload: Record<string, unknown> | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
};

const STATUS_CONFIG = {
  SUCCEEDED: { label: "Succeeded", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400", Icon: CheckCircle2 },
  FAILED:    { label: "Failed",    color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30",    dot: "bg-rose-400",    Icon: XCircle },
  RUNNING:   { label: "Running",   color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/30",    dot: "bg-cyan-400 animate-pulse",    Icon: Loader2 },
  QUEUED:    { label: "Queued",    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",  dot: "bg-amber-400",   Icon: Clock },
  CANCELED:  { label: "Canceled",  color: "text-slate-400",   bg: "bg-slate-700/40 border-slate-600/40",  dot: "bg-slate-500",   Icon: XCircle },
};

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.round(diff / 3600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function extractOutputPreview(payload: Record<string, unknown> | null): {
  type: "prices" | "jobs" | "data" | "summary" | "empty";
  headline: string;
  rows: string[];
  count: number;
  screenshotCount: number;
} {
  if (!payload) return { type: "empty", headline: "No output", rows: [], count: 0, screenshotCount: 0 };

  const screenshots = (payload.screenshots as unknown[]) ?? [];
  const screenshotCount = screenshots.length;
  const summary = payload.summary as string | undefined;
  const output = (payload.output as Record<string, unknown>) ?? {};

  // Price / shopping detection
  const priceData = (output.prices ?? output.results ?? output.comparison ?? output.products ?? output.items) as OutputItem[] | undefined;
  if (Array.isArray(priceData) && priceData.length > 0 && priceData[0]?.price !== undefined) {
    const prices = priceData.filter((p) => p.price != null);
    const best = [...prices].sort((a, b) => {
      const pa = parseFloat(String(a.price).replace(/[^0-9.]/g, ""));
      const pb = parseFloat(String(b.price).replace(/[^0-9.]/g, ""));
      return pa - pb;
    })[0];
    return {
      type: "prices",
      headline: best ? `Best: ${best.price} @ ${best.site ?? "unknown"}` : `${prices.length} prices found`,
      rows: prices.slice(0, 3).map((p) => `${p.site ?? "—"}: ${p.price}`),
      count: prices.length,
      screenshotCount,
    };
  }

  // Jobs detection
  const jobData = (output.jobs ?? output.listings ?? output.positions) as OutputItem[] | undefined;
  if (Array.isArray(jobData) && jobData.length > 0) {
    return {
      type: "jobs",
      headline: `${jobData.length} listings found`,
      rows: jobData.slice(0, 3).map((j) => `${j.title ?? j.name ?? "Job"} @ ${j.company ?? j.site ?? "—"}`),
      count: jobData.length,
      screenshotCount,
    };
  }

  // Generic data
  const dataKeys = Object.keys(output).filter((k) => Array.isArray(output[k]));
  if (dataKeys.length > 0) {
    const key = dataKeys[0]!;
    const arr = output[key] as unknown[];
    return {
      type: "data",
      headline: `${arr.length} ${key} extracted`,
      rows: [],
      count: arr.length,
      screenshotCount,
    };
  }

  if (summary) {
    return {
      type: "summary",
      headline: summary.length > 100 ? summary.slice(0, 97) + "…" : summary,
      rows: [],
      count: 0,
      screenshotCount,
    };
  }

  return { type: "empty", headline: "Execution completed", rows: [], count: 0, screenshotCount };
}

function RunCard({ run }: { run: RunResult }) {
  const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.CANCELED;
  const Icon = cfg.Icon;
  const preview = extractOutputPreview(run.outputPayload);

  return (
    <Link href={`/dashboard/activity/executions/${run.id}`} className="block group">
      <article className={`relative rounded-xl border ${cfg.bg} bg-slate-900/60 p-4 hover:bg-slate-800/60 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
            {run.status === "RUNNING" && <Loader2 size={10} className="text-cyan-400 animate-spin" />}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {preview.screenshotCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <ImageIcon size={10} /> {preview.screenshotCount}
              </span>
            )}
            <span className="text-[10px] text-slate-600 font-mono">{formatDuration(run.durationMs)}</span>
          </div>
        </div>

        {/* Workflow / Agent */}
        <p className="text-sm font-semibold text-white truncate mb-0.5">
          {run.workflowName ?? `Workflow ${run.workflowId?.slice(-6) ?? "—"}`}
        </p>
        <p className="text-xs text-slate-500 mb-3">
          {run.agentName ?? `Agent ${run.agentId.slice(-6)}`}
          <span className="mx-1.5 text-slate-700">·</span>
          {formatRelative(run.createdAt)}
          <span className="mx-1.5 text-slate-700">·</span>
          <span className="uppercase text-[10px]">{run.trigger}</span>
        </p>

        {/* Output preview */}
        {run.status === "SUCCEEDED" && (
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-2.5">
            <p className="text-xs font-medium text-slate-200 mb-1.5">{preview.headline}</p>
            {preview.rows.length > 0 && (
              <div className="space-y-0.5">
                {preview.rows.map((row, i) => (
                  <p key={i} className="text-[11px] text-slate-500 font-mono truncate">→ {row}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {run.status === "FAILED" && run.errorMessage && (
          <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-2.5">
            <p className="text-[11px] text-rose-400/80 font-mono truncate">{run.errorMessage}</p>
          </div>
        )}

        {(run.status === "RUNNING" || run.status === "QUEUED") && (
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-2.5 flex items-center gap-2">
            <Loader2 size={11} className="text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-500">Agent executing…</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-700">{run.id.slice(-12)}</span>
          <ExternalLink size={11} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
        </div>
      </article>
    </Link>
  );
}

const STATUSES = ["ALL", "RUNNING", "SUCCEEDED", "FAILED", "QUEUED", "CANCELED"] as const;

export function ResultsHub({ initialItems, initialTotal }: { initialItems: RunResult[]; initialTotal: number }) {
  const [items, setItems] = useState<RunResult[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [status, setStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasActive = items.some((r) => r.status === "RUNNING" || r.status === "QUEUED");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams({ status, page: "1" });
      const res = await fetch(`/api/internal/results?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { items: RunResult[]; total: number };
        setItems(data.items);
        setTotal(data.total);
        setLastRefresh(new Date());
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [status]);

  // Auto-refresh while active runs exist
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hasActive) {
      intervalRef.current = setInterval(() => void refresh(true), 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hasActive, refresh]);

  // Refetch on filter change
  useEffect(() => { void refresh(); }, [status, refresh]);

  const stats = {
    total: items.length,
    succeeded: items.filter((r) => r.status === "SUCCEEDED").length,
    failed: items.filter((r) => r.status === "FAILED").length,
    running: items.filter((r) => r.status === "RUNNING").length,
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-slate-500" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                status === s
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                  : "bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {s === "ALL" ? `All (${total})` : s}
            </button>
          ))}
        </div>
        {/* Refresh */}
        <button
          onClick={() => void refresh()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
          {hasActive ? <span className="text-cyan-400">Live</span> : formatRelative(lastRefresh.toISOString())}
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "text-white" },
          { label: "Running", value: stats.running, color: "text-cyan-400" },
          { label: "Succeeded", value: stats.succeeded, color: "text-emerald-400" },
          { label: "Failed", value: stats.failed, color: "text-rose-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 text-center">
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 size={12} className="animate-spin" />
          Loading…
        </div>
      )}

      {/* Results grid */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/60 p-12 text-center">
          <Zap size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No executions yet.</p>
          <p className="text-xs text-slate-600 mt-1">Run a workflow to see results here.</p>
          <Link href="/dashboard/workflows" className="mt-4 inline-block text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            Go to Workflows →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((run) => <RunCard key={run.id} run={run} />)}
        </div>
      )}
    </div>
  );
}
