"use client";

import Link from "next/link";
import { Eye, Clock, AlertTriangle, CheckCircle2, Globe } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SentinelCardData = {
  id: string;
  name: string;
  watchUrl: string;
  checkInterval: string;
  status: "watching" | "change_detected";
  lastChecked: string | null;
  changeCount: number;
  lastBriefing?: string;
};

type SentinelGridProps = {
  sentinels: SentinelCardData[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCheckInterval(cron: string): string {
  const intervalMap: Record<string, string> = {
    "0 * * * *": "Every hour",
    "0 */6 * * *": "Every 6h",
    "0 0 * * *": "Every day",
    "0 0 * * 0": "Every week",
  };
  return intervalMap[cron] ?? cron;
}

function formatLastChecked(isoString: string | null): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-800/20 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
        <Eye className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-300">
        No sentinels configured
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Add your first sentinel to start monitoring web URLs for meaningful
        semantic changes.
      </p>
    </div>
  );
}

// ─── Sentinel Card ────────────────────────────────────────────────────────────

function SentinelCard({ sentinel }: { sentinel: SentinelCardData }): JSX.Element {
  const isChangeDetected = sentinel.status === "change_detected";
  const domain = getDomain(sentinel.watchUrl);
  const intervalLabel = formatCheckInterval(sentinel.checkInterval);
  const lastCheckedLabel = formatLastChecked(sentinel.lastChecked);

  return (
    <div
      className={`border rounded-xl p-5 transition-all duration-200 ${
        isChangeDetected
          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
          : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600/60"
      }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Favicon placeholder */}
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800">
            <Globe className="h-4 w-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {sentinel.name}
            </p>
            <p className="truncate text-xs text-slate-500" title={sentinel.watchUrl}>
              {domain}
            </p>
          </div>
        </div>

        {/* Status badge */}
        {isChangeDetected ? (
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="text-[11px] font-semibold text-amber-400">
              Change Detected
            </span>
          </div>
        ) : (
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">
              Watching
            </span>
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">{intervalLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isChangeDetected ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span className="text-xs text-slate-500">
            Last checked {lastCheckedLabel}
          </span>
        </div>

        {sentinel.changeCount > 0 ? (
          <span className="rounded-md border border-slate-700/60 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
            {sentinel.changeCount} change{sentinel.changeCount !== 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      {/* Intelligence Briefing */}
      {sentinel.lastBriefing ? (
        <div
          className={`mt-4 rounded-lg border p-3 ${
            isChangeDetected
              ? "border-amber-500/20 bg-amber-500/5"
              : "border-slate-700/40 bg-slate-800/60"
          }`}
        >
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Intelligence Briefing
          </p>
          <p className="text-xs leading-relaxed text-slate-300">
            {sentinel.lastBriefing}
          </p>
        </div>
      ) : null}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={`/dashboard/sentinels/${sentinel.id}`}
          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View History &rarr;
        </Link>
        <a
          href={sentinel.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          Open URL
        </a>
      </div>
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function SentinelGrid({ sentinels }: SentinelGridProps): JSX.Element {
  if (sentinels.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sentinels.map((sentinel) => (
        <SentinelCard key={sentinel.id} sentinel={sentinel} />
      ))}
    </div>
  );
}
