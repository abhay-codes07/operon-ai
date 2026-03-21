"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, ShoppingCart, DollarSign, Globe, CheckCircle, Copy } from "lucide-react";

type PriceEntry = {
  site?: string;
  store?: string;
  name?: string;
  title?: string;
  price?: string | number;
  url?: string;
  link?: string;
  rating?: string | number;
  availability?: string;
  in_stock?: boolean;
};

type OutputPayload = Record<string, unknown>;

function isPriceComparisonResult(output: OutputPayload): boolean {
  const keys = Object.keys(output).map((k) => k.toLowerCase());
  if (keys.some((k) => ["prices", "results", "comparison", "products", "items"].includes(k))) return true;
  const values = Object.values(output);
  for (const v of values) {
    if (Array.isArray(v) && v.length > 0) {
      const item = v[0] as Record<string, unknown>;
      if (item && typeof item === "object") {
        const itemKeys = Object.keys(item).map((k) => k.toLowerCase());
        if (itemKeys.some((k) => ["price", "site", "store", "url", "link"].includes(k))) return true;
      }
    }
  }
  return false;
}

function extractPriceEntries(output: OutputPayload): PriceEntry[] {
  for (const key of ["prices", "results", "comparison", "products", "items"]) {
    const val = output[key] ?? output[key.charAt(0).toUpperCase() + key.slice(1)];
    if (Array.isArray(val)) return val as PriceEntry[];
  }
  const values = Object.values(output);
  for (const v of values) {
    if (Array.isArray(v) && v.length > 0) {
      const first = v[0] as Record<string, unknown>;
      if (first && typeof first === "object") {
        const itemKeys = Object.keys(first).map((k) => k.toLowerCase());
        if (itemKeys.some((k) => ["price", "site", "store"].includes(k))) return v as PriceEntry[];
      }
    }
  }
  return [];
}

function formatPrice(price: string | number | undefined): string {
  if (!price) return "N/A";
  if (typeof price === "number") return `$${price.toFixed(2)}`;
  return String(price);
}

function getSiteName(entry: PriceEntry): string {
  return entry.site ?? entry.store ?? "Unknown";
}

function getEntryUrl(entry: PriceEntry): string | undefined {
  return entry.url ?? entry.link;
}

function PriceComparisonTable({ entries }: { entries: PriceEntry[] }) {
  const sorted = [...entries].sort((a, b) => {
    const aPrice = parseFloat(String(a.price ?? "").replace(/[^0-9.]/g, "")) || Infinity;
    const bPrice = parseFloat(String(b.price ?? "").replace(/[^0-9.]/g, "")) || Infinity;
    return aPrice - bPrice;
  });

  const lowestPrice = parseFloat(String(sorted[0]?.price ?? "").replace(/[^0-9.]/g, "")) || null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">Price Comparison Across Sites</span>
        <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-400">
          {entries.length} sites
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-800/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Site</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Product</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Price</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Link</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => {
              const entryPrice = parseFloat(String(entry.price ?? "").replace(/[^0-9.]/g, "")) || null;
              const isBest = lowestPrice !== null && entryPrice === lowestPrice;
              const url = getEntryUrl(entry);
              return (
                <tr
                  key={i}
                  className={`border-b border-slate-700/40 transition-colors last:border-0 ${isBest ? "bg-emerald-500/5" : "hover:bg-slate-800/40"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="font-medium text-slate-200">{getSiteName(entry)}</span>
                      {isBest && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          Best
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300 line-clamp-1">{entry.name ?? entry.title ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold tabular-nums ${isBest ? "text-emerald-400" : "text-white"}`}>
                      {formatPrice(entry.price)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700/60 px-2 py-1 text-xs text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ summary }: { summary: string }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Summary</p>
          <p className="text-sm leading-relaxed text-slate-300">{summary}</p>
        </div>
      </div>
    </div>
  );
}

function RawJsonViewer({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  function handleCopy() {
    void navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-slate-600/60 bg-slate-800 px-2 py-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
      >
        <Copy className="h-3 w-3" />
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="max-h-64 overflow-auto rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 text-xs text-slate-300 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        {json}
      </pre>
    </div>
  );
}

type ExecutionOutputViewerProps = {
  outputPayload: OutputPayload;
  summary?: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";
};

export function ExecutionOutputViewer({ outputPayload, summary, status }: ExecutionOutputViewerProps) {
  const [showRaw, setShowRaw] = useState(false);

  const innerOutput = (outputPayload.output as OutputPayload | undefined) ?? outputPayload;
  const innerSummary = (outputPayload.summary as string | undefined) ?? summary;
  const priceEntries = isPriceComparisonResult(innerOutput) ? extractPriceEntries(innerOutput) : [];
  const hasPrices = priceEntries.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {innerSummary && <SummaryCard summary={innerSummary} />}

      {/* Price comparison table */}
      {hasPrices && <PriceComparisonTable entries={priceEntries} />}

      {/* Other structured output fields */}
      {!hasPrices && Object.keys(innerOutput).length > 0 && (
        <div className="space-y-2">
          {Object.entries(innerOutput).map(([key, value]) => {
            if (key === "summary" || key === "screenshots") return null;
            return (
              <div key={key} className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{key}</p>
                {typeof value === "string" ? (
                  <p className="text-sm text-slate-300">{value}</p>
                ) : (
                  <pre className="text-xs text-slate-300">{JSON.stringify(value, null, 2)}</pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Raw JSON toggle */}
      <button
        onClick={() => setShowRaw((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
      >
        {showRaw ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {showRaw ? "Hide" : "Show"} raw output payload
      </button>
      {showRaw && <RawJsonViewer data={outputPayload} />}
    </div>
  );
}
