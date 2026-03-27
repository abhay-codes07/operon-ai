"use client";

import { useState } from "react";
import {
  Target,
  Zap,
  TrendingDown,
  Music,
  Clock,
  CheckCircle,
  ShoppingCart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Agent = {
  id: string;
  name: string;
};

type Snipe = {
  id: string;
  name: string;
  watchUrl: string;
  triggerCondition: string;
  actionTask: string;
  status: "TRIGGERED" | "WATCHING";
  triggeredAt?: string;
  result?: string;
  savedMoney?: string | null;
  currentValue?: string;
  targetValue?: string;
  checkCount: number;
  icon: string;
};

type FormData = {
  name: string;
  watchUrl: string;
  triggerCondition: string;
  actionTask: string;
  savedDetails: string;
  agentId: string;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  TrendingDown,
  Music,
  Target,
};

const INITIAL_SNIPES: Snipe[] = [
  {
    id: "snipe-1",
    name: "RTX 5090 GPU Restock",
    watchUrl: "bestbuy.com/rtx-5090",
    triggerCondition: "Item comes back in stock",
    actionTask: "Add to cart and complete checkout with saved payment",
    status: "TRIGGERED",
    triggeredAt: "2 minutes ago",
    result: "Successfully purchased — Order #BB-2847291",
    savedMoney: null,
    checkCount: 847,
    icon: "Zap",
  },
  {
    id: "snipe-2",
    name: "iPhone 16 Pro — Price Drop",
    watchUrl: "amazon.com/iphone-16-pro",
    triggerCondition: "Price drops below $899",
    actionTask: "Add to cart, apply any available coupons, checkout",
    status: "WATCHING",
    currentValue: "$979",
    targetValue: "$899",
    checkCount: 234,
    icon: "TrendingDown",
  },
  {
    id: "snipe-3",
    name: "Taylor Swift Eras Tour Ticket",
    watchUrl: "ticketmaster.com/taylor-swift-eras",
    triggerCondition: "Any floor/pit tickets become available under $400",
    actionTask: "Select best available seats and complete purchase",
    status: "WATCHING",
    currentValue: "Sold Out",
    checkCount: 1203,
    icon: "Music",
  },
];

const inputClass = cn(
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
  "px-3 py-2 text-sm placeholder-slate-500",
  "focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
  "transition-colors",
);

function PriceProgress({ current, target }: { current: string; target: string }) {
  const currentNum = parseFloat(current.replace(/[^0-9.]/g, ""));
  const targetNum = parseFloat(target.replace(/[^0-9.]/g, ""));
  if (isNaN(currentNum) || isNaN(targetNum) || currentNum === 0) return null;

  const startNum = currentNum * 1.3;
  const progress = Math.max(0, Math.min(100, ((startNum - currentNum) / (startNum - targetNum)) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Current: <span className="text-amber-400 font-semibold">{current}</span></span>
        <span className="text-slate-500">Target: <span className="text-emerald-400 font-semibold">{target}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500">{Math.round(progress)}% of the way to your target price</p>
    </div>
  );
}

function SnipeCard({ snipe }: { snipe: Snipe }) {
  const IconComponent = ICON_MAP[snipe.icon] ?? Target;
  const isTriggered = snipe.status === "TRIGGERED";

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-5 transition-all duration-300",
        isTriggered
          ? "border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-slate-900/80 shadow-lg shadow-emerald-500/20"
          : "border-slate-700/60 bg-gradient-to-b from-slate-800/60 to-slate-900/60",
      )}
    >
      {/* Victory glow for triggered */}
      {isTriggered && (
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            isTriggered
              ? "bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/30"
              : "bg-slate-800 border border-slate-700",
          )}>
            <IconComponent className={cn("h-5 w-5", isTriggered ? "text-white" : "text-cyan-400")} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{snipe.name}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{snipe.watchUrl}</p>
          </div>
        </div>

        <span className={cn(
          "flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold border",
          isTriggered
            ? "animate-pulse bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            : "animate-pulse bg-amber-500/20 text-amber-400 border-amber-500/40",
        )}>
          {isTriggered ? "TRIGGERED" : "WATCHING"}
        </span>
      </div>

      {/* Trigger condition */}
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-1">When</p>
        <p className="text-sm text-slate-300">{snipe.triggerCondition}</p>
      </div>

      {/* Action */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Will</p>
        <p className="text-sm italic text-cyan-400">{snipe.actionTask}</p>
      </div>

      {/* TRIGGERED victory banner */}
      {isTriggered && snipe.result && (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-bold text-emerald-300">SNIPED ✓</span>
            {snipe.triggeredAt && (
              <span className="ml-auto text-[11px] text-emerald-600">{snipe.triggeredAt}</span>
            )}
          </div>
          <p className="text-xs text-emerald-400/80">{snipe.result}</p>
          <button
            disabled
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 opacity-70 cursor-not-allowed"
          >
            <ShoppingCart className="h-3 w-3" />
            Order Confirmation
          </button>
        </div>
      )}

      {/* WATCHING price progress */}
      {!isTriggered && snipe.currentValue && snipe.targetValue && (
        <div className="mb-4">
          <PriceProgress current={snipe.currentValue} target={snipe.targetValue} />
        </div>
      )}

      {!isTriggered && snipe.currentValue && !snipe.targetValue && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-amber-400">Current status: <span className="font-semibold">{snipe.currentValue}</span></p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-slate-700/40">
        <Clock className="h-3 w-3 text-slate-600" />
        <span className="text-[11px] text-slate-500">
          Checked <span className="text-slate-400 font-semibold">{snipe.checkCount.toLocaleString()}</span> times
        </span>
      </div>
    </div>
  );
}

export function SnapbuyDashboard({ agents }: { agents: Agent[] }) {
  const [snipes, setSnipes] = useState<Snipe[]>(INITIAL_SNIPES);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    watchUrl: "",
    triggerCondition: "",
    actionTask: "",
    savedDetails: "",
    agentId: agents[0]?.id ?? "",
  });

  const totalChecks = snipes.reduce((sum, s) => sum + s.checkCount, 0);
  const triggered = snipes.filter((s) => s.status === "TRIGGERED").length;
  const active = snipes.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.agentId) {
      setFormError("Select an agent.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/internal/snapbuy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      // Optimistic add
      const newSnipe: Snipe = {
        id: `snipe-${Date.now()}`,
        name: formData.name,
        watchUrl: formData.watchUrl,
        triggerCondition: formData.triggerCondition,
        actionTask: formData.actionTask,
        status: "WATCHING",
        checkCount: 0,
        icon: "Target",
      };

      setSnipes((prev) => [newSnipe, ...prev]);
      setShowForm(false);
      setFormData({
        name: "",
        watchUrl: "",
        triggerCondition: "",
        actionTask: "",
        savedDetails: "",
        agentId: agents[0]?.id ?? "",
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
            Autonomous Commerce
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">SnapBuy</h1>
          <p className="mt-1 text-base text-slate-400">Set it. Forget it. Own it.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
            "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
            "hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
          )}
        >
          <Target className="h-4 w-4" />
          New Snipe
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Snipes", value: active.toString(), colorClass: "text-cyan-400" },
          { label: "Total Triggered", value: triggered.toString(), colorClass: "text-emerald-400" },
          { label: "Items Secured", value: triggered.toString(), colorClass: "text-cyan-400" },
          { label: "Checks Run", value: totalChecks.toLocaleString(), colorClass: "text-slate-300" },
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

      {/* New Snipe form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Arm a New Snipe</h2>
              <p className="text-xs text-slate-400 mt-0.5">Define the target, condition, and action. The agent does the rest.</p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Snipe Name</label>
                <input
                  required
                  className={inputClass}
                  placeholder="e.g. RTX 5090 GPU Restock"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Watch URL</label>
                <input
                  required
                  type="url"
                  className={inputClass}
                  placeholder="https://bestbuy.com/product/..."
                  value={formData.watchUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, watchUrl: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Trigger Condition
              </label>
              <textarea
                required
                rows={2}
                className={cn(inputClass, "resize-none")}
                placeholder="When should I fire? e.g. 'price drops below $999' or 'back in stock'"
                value={formData.triggerCondition}
                onChange={(e) => setFormData((p) => ({ ...p, triggerCondition: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Action to Take
              </label>
              <textarea
                required
                rows={2}
                className={cn(inputClass, "resize-none")}
                placeholder="What should I do? e.g. 'add to cart and checkout' or 'book the first available slot'"
                value={formData.actionTask}
                onChange={(e) => setFormData((p) => ({ ...p, actionTask: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Saved Details <span className="normal-case font-normal text-slate-600">(optional)</span>
              </label>
              <textarea
                rows={2}
                className={cn(inputClass, "resize-none")}
                placeholder="Shipping address, payment method, login credentials if needed"
                value={formData.savedDetails}
                onChange={(e) => setFormData((p) => ({ ...p, savedDetails: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Agent</label>
              {agents.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No agents available. Provision an agent first.</p>
              ) : (
                <select
                  value={formData.agentId}
                  onChange={(e) => setFormData((p) => ({ ...p, agentId: e.target.value }))}
                  disabled={loading}
                  className={cn(inputClass, "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed")}
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900">
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
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
                "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20",
                "hover:from-red-400 hover:to-orange-400 hover:shadow-red-500/30",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                "focus:outline-none focus:ring-2 focus:ring-red-500/50",
              )}
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Arming...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  Arm Snipe
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Snipe cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {snipes.map((snipe) => (
          <SnipeCard key={snipe.id} snipe={snipe} />
        ))}
      </div>
    </div>
  );
}
