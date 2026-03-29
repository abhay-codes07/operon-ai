"use client";

import { useState } from "react";
import {
  HeartPulse,
  Plus,
  Trash2,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Agent = {
  id: string;
  name: string;
};

type JourneyStatus = "HEALTHY" | "DEGRADED" | "FAILING";

type Journey = {
  id: string;
  name: string;
  targetUrl: string;
  steps: string[];
  status: JourneyStatus;
  uptime: number;
  avgDurationMs: number;
  lastRunAt: string;
  lastRunStatus: "PASSED" | "FAILED";
  failureStep?: string;
  failureReason?: string;
  checksToday: number;
  failuresLast7d: number;
  heartbeatHistory: number[];
};

const INITIAL_JOURNEYS: Journey[] = [];

const inputClass = cn(
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
  "px-3 py-2 text-sm placeholder-slate-500",
  "focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
  "transition-colors",
);

function HeartbeatChart({ history }: { history: number[] }) {
  const last24 = history.slice(-24);
  return (
    <div>
      <div className="flex items-end gap-0.5 h-8">
        {last24.map((val, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm transition-all",
              val === 1
                ? "bg-emerald-400 h-full"
                : "bg-red-500 h-[30%]",
            )}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mt-1">Last 24 checks</p>
    </div>
  );
}

function UptimeBadge({ uptime }: { uptime: number }) {
  const colorClass =
    uptime >= 99 ? "text-emerald-400" : uptime >= 95 ? "text-amber-400" : "text-red-400";
  return (
    <span className={cn("text-2xl font-bold tabular-nums", colorClass)}>
      {uptime.toFixed(1)}%
    </span>
  );
}

function JourneyCard({ journey }: { journey: Journey }) {
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const isDegraded = journey.status === "DEGRADED" || journey.status === "FAILING";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all duration-300",
        isDegraded
          ? "border-red-500/40 bg-gradient-to-b from-red-950/30 to-slate-900/80 shadow-lg shadow-red-500/10"
          : "border-slate-700/60 bg-gradient-to-b from-slate-800/60 to-slate-900/60",
      )}
    >
      {/* Degraded alert banner */}
      {isDegraded && journey.failureReason && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-300">
              FAILING — {journey.failureReason}
            </p>
            <p className="text-[11px] text-red-500 mt-0.5">Alert sent {journey.lastRunAt}</p>
          </div>
        </div>
      )}

      {/* Top section */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className={cn(
            "h-3 w-3 rounded-full flex-shrink-0",
            isDegraded
              ? "bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)] animate-pulse"
              : "bg-emerald-500 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)] animate-pulse",
          )} />
          <div>
            <h3 className="font-semibold text-white text-sm">{journey.name}</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{journey.targetUrl}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold border",
            isDegraded
              ? "border-red-500/40 bg-red-500/20 text-red-400"
              : "border-emerald-500/40 bg-emerald-500/20 text-emerald-400",
          )}>
            {journey.status}
          </span>
          <UptimeBadge uptime={journey.uptime} />
        </div>
      </div>

      {/* Last run */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-3 w-3 text-slate-600" />
        <span className="text-xs text-slate-500">Last run: {journey.lastRunAt} —</span>
        <span className={cn(
          "text-xs font-semibold",
          journey.lastRunStatus === "PASSED" ? "text-emerald-400" : "text-red-400",
        )}>
          {journey.lastRunStatus}
        </span>
      </div>

      {/* EKG chart */}
      <div className="mb-4 rounded-xl border border-slate-700/40 bg-slate-900/60 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Heartbeat</p>
        <HeartbeatChart history={journey.heartbeatHistory} />
      </div>

      {/* Steps list */}
      <div className="mb-4">
        <button
          onClick={() => setStepsExpanded((v) => !v)}
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors mb-2"
        >
          <span>Journey Steps ({journey.steps.length})</span>
          <span className="text-slate-700">{stepsExpanded ? "▲" : "▼"}</span>
        </button>

        {stepsExpanded && (
          <ol className="space-y-2">
            {journey.steps.map((step, idx) => {
              const isFailing = step === journey.failureStep;
              return (
                <li key={idx} className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2",
                  isFailing ? "bg-red-500/10 border border-red-500/20" : "bg-slate-800/40",
                )}>
                  <span className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5",
                    isFailing
                      ? "bg-red-500 text-white"
                      : isDegraded
                        ? "bg-slate-700 text-slate-400"
                        : "bg-emerald-500/30 text-emerald-400 border border-emerald-500/30",
                  )}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-xs",
                      isFailing ? "text-red-300 font-medium" : "text-slate-300",
                    )}>
                      {step}
                    </p>
                    {isFailing && journey.failureReason && (
                      <p className="mt-1 text-[11px] italic text-red-400">{journey.failureReason}</p>
                    )}
                  </div>
                  {!isFailing && !isDegraded && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5 ml-auto" />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/40">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Avg: <span className="text-slate-300 font-semibold">{(journey.avgDurationMs / 1000).toFixed(1)}s</span></span>
          <span>Checks today: <span className="text-slate-300 font-semibold">{journey.checksToday}</span></span>
          <span className={cn(
            "font-semibold",
            journey.failuresLast7d > 5 ? "text-red-400" : journey.failuresLast7d > 0 ? "text-amber-400" : "text-emerald-400",
          )}>
            {journey.failuresLast7d} failures (7d)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors">
            <PlayCircle className="h-3 w-3" />
            Run Now
          </button>
          <button
            disabled
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-600 opacity-60 cursor-not-allowed"
          >
            <Camera className="h-3 w-3" />
            View Screenshots
          </button>
        </div>
      </div>
    </div>
  );
}

type FormState = {
  name: string;
  targetUrl: string;
  steps: string[];
  agentId: string;
  checkIntervalMinutes: number;
};

export function HeartbeatDashboard({ agents }: { agents: Agent[] }) {
  const [journeys, setJourneys] = useState<Journey[]>(INITIAL_JOURNEYS);
  const [addingJourney, setAddingJourney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    targetUrl: "",
    steps: ["Navigate to the target page", "Verify the page loaded correctly", "Check for any error messages"],
    agentId: agents[0]?.id ?? "",
    checkIntervalMinutes: 15,
  });

  const healthyCount = journeys.filter((j) => j.status === "HEALTHY").length;
  const degradedCount = journeys.filter((j) => j.status !== "HEALTHY").length;

  function addStep() {
    setForm((p) => ({ ...p, steps: [...p.steps, ""] }));
  }

  function removeStep(idx: number) {
    setForm((p) => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }));
  }

  function updateStep(idx: number, val: string) {
    setForm((p) => {
      const steps = [...p.steps];
      steps[idx] = val;
      return { ...p, steps };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const filteredSteps = form.steps.filter((s) => s.trim().length > 0);
    if (filteredSteps.length === 0) {
      setFormError("Add at least one step.");
      return;
    }
    if (!form.agentId) {
      setFormError("Select an agent.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/internal/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, steps: filteredSteps }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      const optimistic: Journey = {
        id: `hb-${Date.now()}`,
        name: form.name,
        targetUrl: form.targetUrl,
        steps: filteredSteps,
        status: "HEALTHY",
        uptime: 100,
        avgDurationMs: 0,
        lastRunAt: "just now",
        lastRunStatus: "PASSED",
        checksToday: 0,
        failuresLast7d: 0,
        heartbeatHistory: [],
      };

      setJourneys((prev) => [optimistic, ...prev]);
      setAddingJourney(false);
      setForm({
        name: "",
        targetUrl: "",
        steps: ["Navigate to the target page", "Verify the page loaded correctly", "Check for any error messages"],
        agentId: agents[0]?.id ?? "",
        checkIntervalMinutes: 15,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">
            Synthetic Monitoring
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Heartbeat</h1>
          <p className="mt-1 text-base text-slate-400">
            Your product, tested every 15 minutes by a real browser agent
          </p>
        </div>
        <button
          onClick={() => setAddingJourney((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
            "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
            "hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
          )}
        >
          <HeartPulse className="h-4 w-4" />
          Add Journey
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Journeys Monitored", value: journeys.length.toString(), colorClass: "text-cyan-400" },
          { label: "All Passing", value: healthyCount.toString(), colorClass: "text-emerald-400" },
          { label: "Degraded", value: degradedCount.toString(), colorClass: degradedCount > 0 ? "text-red-400" : "text-slate-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3"
          >
            <p className={cn("text-2xl font-bold", stat.colorClass)}>{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Add Journey form */}
      {addingJourney && (
        <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Define a User Journey</h2>
              <p className="text-xs text-slate-400 mt-0.5">Describe the steps in plain English. The agent runs them like a real user.</p>
            </div>
            <button
              onClick={() => setAddingJourney(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Journey Name</label>
                <input
                  required
                  className={inputClass}
                  placeholder="e.g. New User Signup Flow"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Target URL</label>
                <input
                  required
                  type="url"
                  className={inputClass}
                  placeholder="https://app.yourproduct.com"
                  value={form.targetUrl}
                  onChange={(e) => setForm((p) => ({ ...p, targetUrl: e.target.value }))}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Journey Steps
              </label>
              {form.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  <input
                    className={inputClass}
                    placeholder={`Step ${idx + 1}...`}
                    value={step}
                    onChange={(e) => updateStep(idx, e.target.value)}
                  />
                  {form.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-700 hover:text-rose-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Step
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Agent</label>
                {agents.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No agents available.</p>
                ) : (
                  <select
                    value={form.agentId}
                    onChange={(e) => setForm((p) => ({ ...p, agentId: e.target.value }))}
                    disabled={loading}
                    className={cn(inputClass, "cursor-pointer disabled:opacity-50")}
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id} className="bg-slate-900">
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Check Interval</label>
                <select
                  value={form.checkIntervalMinutes}
                  onChange={(e) => setForm((p) => ({ ...p, checkIntervalMinutes: Number(e.target.value) }))}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value={5} className="bg-slate-900">Every 5 min</option>
                  <option value={15} className="bg-slate-900">Every 15 min</option>
                  <option value={30} className="bg-slate-900">Every 30 min</option>
                  <option value={60} className="bg-slate-900">Every 1 hour</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || agents.length === 0}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all",
                "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/20",
                "hover:from-emerald-400 hover:to-cyan-500 hover:shadow-emerald-500/30",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
              )}
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Activating...
                </>
              ) : (
                <>
                  <HeartPulse className="h-4 w-4" />
                  Activate Heartbeat
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Journey cards */}
      <div className="space-y-4">
        {journeys.map((journey) => (
          <JourneyCard key={journey.id} journey={journey} />
        ))}
      </div>

      {journeys.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 py-16 text-center">
          <HeartPulse className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No journeys being monitored</p>
          <p className="text-slate-600 text-sm mt-1">
            Click &quot;Add Journey&quot; to start synthetic monitoring.
          </p>
        </div>
      )}
    </div>
  );
}
