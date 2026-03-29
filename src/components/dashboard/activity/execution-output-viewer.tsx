"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShoppingCart,
  Globe,
  CheckCircle,
  Copy,
  Download,
} from "lucide-react";

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

/** Renders a value as human-readable text — no raw JSON blobs */
function SmartValue({ label, value, depth = 0 }: { label?: string; value: unknown; depth?: number }) {
  if (value === null || value === undefined) return null;

  // Plain string/number/bool
  if (typeof value === "string") {
    return (
      <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">{value}</p>
    );
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="text-sm text-slate-300">{String(value)}</p>;
  }

  // Array of objects → table
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
    const rows = value as Record<string, unknown>[];
    const headers = Object.keys(rows[0] ?? {});
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-700/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-800/60">
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {h.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-800/40">
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2 text-slate-300">
                    {typeof row[h] === "string" || typeof row[h] === "number" || typeof row[h] === "boolean"
                      ? String(row[h])
                      : row[h] == null
                        ? "—"
                        : JSON.stringify(row[h])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Array of strings/numbers → bullet list
  if (Array.isArray(value)) {
    return (
      <ul className="ml-4 list-disc space-y-1">
        {value.map((item, i) => (
          <li key={i} className="text-sm text-slate-300">
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  // Nested object → recursive key-value cards
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined);
    if (entries.length === 0) return null;
    return (
      <div className={depth > 0 ? "pl-3 border-l border-slate-700/60 space-y-3" : "space-y-3"}>
        {entries.map(([k, v]) => (
          <div key={k}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {k.replace(/_/g, " ")}
            </p>
            <SmartValue value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  return null;
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

function buildTextReport(outputPayload: OutputPayload, summary?: string): string {
  const lines: string[] = ["EXECUTION RESULT REPORT", "=".repeat(40), ""];

  if (summary) {
    lines.push("SUMMARY", "-".repeat(20), summary, "");
  }

  function appendValue(key: string, value: unknown, indent = 0) {
    const pad = "  ".repeat(indent);
    if (value === null || value === undefined) return;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      lines.push(`${pad}${key}: ${String(value)}`);
    } else if (Array.isArray(value)) {
      lines.push(`${pad}${key}:`);
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          lines.push(`${pad}  [${i + 1}]`);
          Object.entries(item as Record<string, unknown>).forEach(([k, v]) => {
            appendValue(k, v, indent + 2);
          });
        } else {
          lines.push(`${pad}  - ${String(item)}`);
        }
      });
    } else if (typeof value === "object") {
      lines.push(`${pad}${key}:`);
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        appendValue(k, v, indent + 1);
      });
    }
  }

  Object.entries(outputPayload).forEach(([key, value]) => {
    if (key === "screenshots") return;
    appendValue(key.toUpperCase().replace(/_/g, " "), value);
    lines.push("");
  });

  lines.push("=".repeat(40));
  lines.push(`Generated by Operon AI · ${new Date().toLocaleString()}`);
  return lines.join("\n");
}

function downloadAsPdf(outputPayload: OutputPayload, summary?: string) {
  const text = buildTextReport(outputPayload, summary);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Execution Result</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 40px; line-height: 1.6; }
  h1 { font-size: 20px; color: #0f172a; border-bottom: 2px solid #0891b2; padding-bottom: 8px; }
  .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin: 16px 0 4px; }
  .value { font-size: 13px; color: #1e293b; white-space: pre-line; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; border: 1px solid #e2e8f0; }
  td { padding: 7px 12px; border: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { font-size: 10px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>Execution Result Report</h1>
<pre style="font-family:inherit;white-space:pre-wrap;font-size:13px">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
<div class="footer">Generated by Operon AI &middot; ${new Date().toLocaleString()}</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onafterprint = () => URL.revokeObjectURL(url);
  }
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
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {innerSummary && <CheckCircle className="h-4 w-4 text-emerald-400" />}
        <div className="ml-auto flex items-center gap-2">
          {status === "SUCCEEDED" && (
            <button
              onClick={() => downloadAsPdf(outputPayload, innerSummary)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {innerSummary && <SummaryCard summary={innerSummary} />}

      {/* Price comparison table */}
      {hasPrices && <PriceComparisonTable entries={priceEntries} />}

      {/* Human-readable structured output */}
      {!hasPrices && Object.keys(innerOutput).length > 0 && (
        <div className="space-y-3">
          {Object.entries(innerOutput).map(([key, value]) => {
            if (key === "summary" || key === "screenshots") return null;
            return (
              <div key={key} className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {key.replace(/_/g, " ")}
                </p>
                <SmartValue value={value} />
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
