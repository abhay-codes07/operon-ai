"use client";

import { useState } from "react";
import { BellRing, X, ExternalLink, Clock, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Agent = {
  id: string;
  name: string;
};

type Watch = {
  id: string;
  productName: string;
  productUrl: string;
  currentPrice: number;
  targetPrice: number;
  lowestEver: number;
  status: "WATCHING" | "ALERT_SENT";
  checksToday: number;
  priceHistory: number[];
  savings: number;
  percentOff: number;
  lastChecked: string;
  retailer: string;
  alertSentAt?: string;
  alertPrice?: number;
};

type FormData = {
  productName: string;
  productUrl: string;
  currentPrice: string;
  targetPrice: string;
  checkIntervalHours: string;
  agentId: string;
};

const INITIAL_WATCHES: Watch[] = [];

const inputClass = cn(
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
  "px-3 py-2 text-sm placeholder-slate-500",
  "focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
  "transition-colors",
);

function PriceSparkline({ history, color = "#22d3ee" }: { history: number[]; color?: string }) {
  if (history.length < 2) return null;

  const width = 280;
  const height = 48;
  const padding = 4;

  const minVal = Math.min(...history);
  const maxVal = Math.max(...history);
  const range = maxVal - minVal || 1;

  const points = history.map((val, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${points[points.length - 1]!.x.toFixed(1)} ${height} L ${points[0]!.x.toFixed(1)} ${height} Z`;

  const lastPoint = points[points.length - 1]!;

  const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Endpoint dot */}
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

function WatchCard({ watch }: { watch: Watch }) {
  const isAlertSent = watch.status === "ALERT_SENT";
  const isAtTarget = watch.currentPrice <= watch.targetPrice;

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all duration-300",
        isAlertSent
          ? "border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-900 shadow-lg shadow-amber-900/20"
          : "border-slate-700/60 bg-slate-900",
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-semibold text-white text-sm leading-snug flex-1">
          {watch.productName}
        </h3>
        <span
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border",
            isAlertSent
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isAlertSent ? "bg-amber-400 animate-pulse" : "bg-cyan-400 animate-pulse",
            )}
          />
          {isAlertSent ? "ALERT SENT" : "WATCHING"}
        </span>
      </div>

      {/* Price section */}
      <div className="text-center mb-4">
        <p
          className={cn(
            "text-4xl font-bold tabular-nums",
            isAtTarget ? "text-cyan-400" : "text-white",
          )}
        >
          ${watch.currentPrice.toLocaleString()}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          Target:{" "}
          <span className="font-semibold text-slate-300">
            ${watch.targetPrice.toLocaleString()}
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Lowest ever: ${watch.lowestEver.toLocaleString()}
        </p>
      </div>

      {/* Sparkline */}
      <div className="mb-4">
        <PriceSparkline history={watch.priceHistory} color="#22d3ee" />
      </div>

      {/* Savings pill */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
          {watch.percentOff}% off = save ${watch.savings}
        </span>
      </div>

      {/* Alert banner */}
      {isAlertSent && watch.alertSentAt && watch.alertPrice !== undefined && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-400 font-semibold mb-1">
            Alert sent {watch.alertSentAt} — dropped to ${watch.alertPrice.toLocaleString()}
          </p>
          <a
            href={`https://${watch.productUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors"
          >
            Check Price Now
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-slate-700/40">
        <Clock className="h-3 w-3 text-slate-600" />
        <span className="text-[11px] text-slate-500">
          Checked{" "}
          <span className="text-slate-400 font-semibold">{watch.checksToday}</span>x today
          {" · "}
          {watch.retailer}
        </span>
        <span className="ml-auto text-[11px] text-slate-600">{watch.lastChecked}</span>
      </div>
    </div>
  );
}

export function PricewatchDashboard({ agents }: { agents: Agent[] }) {
  const [watches, setWatches] = useState<Watch[]>(INITIAL_WATCHES);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    productUrl: "",
    currentPrice: "",
    targetPrice: "",
    checkIntervalHours: "1",
    agentId: agents[0]?.id ?? "",
  });

  const alertsSent = watches.filter((w) => w.status === "ALERT_SENT").length;
  const totalChecks = watches.reduce((sum, w) => sum + w.checksToday, 0);
  const avgSavings =
    alertsSent > 0
      ? Math.round(
          watches
            .filter((w) => w.status === "ALERT_SENT")
            .reduce((sum, w) => sum + w.savings, 0) / alertsSent,
        )
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.agentId) {
      setFormError("Select an agent.");
      return;
    }

    const targetPriceNum = parseFloat(formData.targetPrice);
    const currentPriceNum = formData.currentPrice ? parseFloat(formData.currentPrice) : undefined;

    if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
      setFormError("Enter a valid target price.");
      return;
    }

    setLoading(true);
    try {
      const normalizedUrl = formData.productUrl.match(/^https?:\/\//)
        ? formData.productUrl
        : `https://${formData.productUrl}`;
      const res = await fetch("/api/internal/pricewatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: formData.productName,
          productUrl: normalizedUrl,
          targetPrice: targetPriceNum,
          currentPrice: currentPriceNum,
          agentId: formData.agentId,
          checkIntervalHours: parseInt(formData.checkIntervalHours, 10),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      const newWatch: Watch = {
        id: `pw-${Date.now()}`,
        productName: formData.productName,
        productUrl: formData.productUrl,
        currentPrice: currentPriceNum ?? targetPriceNum,
        targetPrice: targetPriceNum,
        lowestEver: currentPriceNum ?? targetPriceNum,
        status: "WATCHING",
        checksToday: 0,
        priceHistory: currentPriceNum ? [currentPriceNum] : [targetPriceNum],
        savings: currentPriceNum ? Math.max(0, currentPriceNum - targetPriceNum) : 0,
        percentOff: currentPriceNum
          ? Math.round(((currentPriceNum - targetPriceNum) / currentPriceNum) * 100 * 10) / 10
          : 0,
        lastChecked: "just now",
        retailer: "Web",
      };

      setWatches((prev) => [newWatch, ...prev]);
      setShowForm(false);
      setFormData({
        productName: "",
        productUrl: "",
        currentPrice: "",
        targetPrice: "",
        checkIntervalHours: "1",
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
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">
            Price Intelligence
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">PriceWatch</h1>
          <p className="mt-1 text-base text-slate-400">
            Your personal price intelligence. Never pay full price.
          </p>
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
          <BellRing className="h-4 w-4" />
          Watch a Product
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <p className="text-2xl font-bold text-cyan-400">{watches.length}</p>
          <p className="mt-0.5 text-xs text-slate-500">Products Watching</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <p className="text-2xl font-bold text-amber-400">{alertsSent}</p>
          <p className="mt-0.5 text-xs text-slate-500">Alerts Sent</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <p className="text-2xl font-bold text-cyan-400">
            {alertsSent > 0 ? `$${avgSavings}` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Avg Savings/Alert</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <p className="text-2xl font-bold text-slate-300">{totalChecks}</p>
          <p className="mt-0.5 text-xs text-slate-500">Checks Run Today</p>
        </div>
      </div>

      {/* New Watch form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Watch a Product</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set your target price and get alerted the moment it drops.
              </p>
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
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Product Name
                </label>
                <input
                  required
                  className={inputClass}
                  placeholder="e.g. Sony WH-1000XM5"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, productName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Product URL
                </label>
                <input
                  required
                  className={inputClass}
                  placeholder="https://amazon.com/product/..."
                  value={formData.productUrl}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, productUrl: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Current Price{" "}
                  <span className="normal-case font-normal text-slate-600">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={cn(inputClass, "pl-6")}
                    placeholder="0.00"
                    value={formData.currentPrice}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, currentPrice: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Alert me when price drops below
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    $
                  </span>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={cn(inputClass, "pl-6")}
                    placeholder="0.00"
                    value={formData.targetPrice}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, targetPrice: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Check Frequency
                </label>
                <select
                  value={formData.checkIntervalHours}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, checkIntervalHours: e.target.value }))
                  }
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value="1" className="bg-slate-900">
                    Every hour
                  </option>
                  <option value="6" className="bg-slate-900">
                    Every 6 hours
                  </option>
                  <option value="24" className="bg-slate-900">
                    Once daily
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Agent
                </label>
                {agents.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">
                    No agents available. Provision an agent first.
                  </p>
                ) : (
                  <select
                    value={formData.agentId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, agentId: e.target.value }))
                    }
                    disabled={loading}
                    className={cn(
                      inputClass,
                      "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id} className="bg-slate-900">
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
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
                "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
                "hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
              )}
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Setting Alert...
                </>
              ) : (
                <>
                  <BellRing className="h-4 w-4" />
                  Set Alert
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Watch cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {watches.map((watch) => (
          <WatchCard key={watch.id} watch={watch} />
        ))}
      </div>

      {watches.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No products being watched yet</p>
          <p className="text-slate-600 text-sm mt-1">
            Click &quot;Watch a Product&quot; to start monitoring prices.
          </p>
        </div>
      )}
    </div>
  );
}
