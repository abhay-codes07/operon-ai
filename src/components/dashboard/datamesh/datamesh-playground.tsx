"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Copy, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type FieldType = "string" | "number" | "boolean" | "array" | "object";

type Field = {
  id: string;
  name: string;
  type: FieldType;
};

type ActiveTab = "playground" | "api";

const FIELD_TYPES: FieldType[] = ["string", "number", "boolean", "array", "object"];

const DEFAULT_FIELDS: Field[] = [
  { id: "1", name: "title", type: "string" },
  { id: "2", name: "price", type: "number" },
  { id: "3", name: "rating", type: "number" },
];

const MOCK_RESULT = {
  success: true,
  url: "",
  data: {
    title: "Apple iPhone 16 Pro 256GB - Desert Titanium",
    price: 979.99,
    rating: 4.6,
  },
  extractedAt: "2026-03-27T10:23:44Z",
  confidence: 0.96,
  steps: 5,
  cost: "$0.08",
};

const inputClass = cn(
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
  "px-3 py-2 text-sm placeholder-slate-500",
  "focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
);

const API_REFERENCE = `# DataMesh Extraction API

## Authentication
Pass your API key in the request header:
  x-api-key: op_live_xxxxxxxxxxxx

## Endpoint

POST /api/v1/extract

## Request Body

{
  "url": string,          // Required. The target URL to extract from.
  "schema": {             // Required. Map of field names to types.
    "fieldName": "string" | "number" | "boolean" | "array" | "object"
  },
  "instructions": string  // Optional. Natural language guidance for extraction.
}

## Response

{
  "success": boolean,
  "url": string,
  "data": object,         // Extracted fields matching your schema.
  "extractedAt": string,  // ISO 8601 timestamp.
  "confidence": number,   // Extraction confidence score (0–1).
  "steps": number,        // Browser steps taken.
  "cost": string          // Estimated cost per call.
}

## Example Request

curl -X POST https://your-operon.vercel.app/api/v1/extract \\
  -H "x-api-key: op_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.amazon.com/dp/B09G3HRMVZ",
    "schema": {
      "title": "string",
      "price": "number",
      "rating": "number"
    },
    "instructions": "Extract the current sale price, not the original price"
  }'

## Example Response

{
  "success": true,
  "url": "https://www.amazon.com/dp/B09G3HRMVZ",
  "data": {
    "title": "Apple AirPods Pro (2nd Gen)",
    "price": 189.99,
    "rating": 4.7
  },
  "extractedAt": "2026-03-27T10:23:44Z",
  "confidence": 0.96,
  "steps": 5,
  "cost": "$0.08"
}

## Error Codes

401  Missing or invalid API key
400  Invalid request payload (schema validation failed)
422  Unable to extract requested fields from target URL
429  Rate limit exceeded (100 req/min per key)
500  Internal server error`;

export function DataMeshPlayground() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("playground");
  const [url, setUrl] = useState("");
  const [fields, setFields] = useState<Field[]>(DEFAULT_FIELDS);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null);
  const [copied, setCopied] = useState(false);

  function addField() {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", type: "string" },
    ]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFieldName(id: string, name: string) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f)),
    );
  }

  function updateFieldType(id: string, type: FieldType) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type } : f)),
    );
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    // Simulate 2s loading then show mock result
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    setResult({ ...MOCK_RESULT, url: url.trim() });
    setLoading(false);
  }

  function buildCurlCommand() {
    const schema = fields
      .filter((f) => f.name.trim())
      .reduce<Record<string, string>>((acc, f) => {
        acc[f.name] = f.type;
        return acc;
      }, {});

    return `curl -X POST https://your-operon.vercel.app/api/v1/extract \\
  -H "x-api-key: op_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "${url || "https://www.amazon.com/product/..."}", "schema": ${JSON.stringify(schema)}}'`;
  }

  async function handleCopyCurl() {
    try {
      await navigator.clipboard.writeText(buildCurlCommand());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — silently ignore
    }
  }

  const schemaPreview = fields
    .filter((f) => f.name.trim())
    .reduce<Record<string, string>>((acc, f) => {
      acc[f.name] = f.type;
      return acc;
    }, {});

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex border-b border-slate-700/60">
        {(["playground", "api"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200",
            )}
          >
            {tab === "playground" ? "Playground" : "API Reference"}
          </button>
        ))}
      </div>

      {activeTab === "playground" ? (
        <div className="pt-5">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left panel — Define schema */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">
                Define Extraction Schema
              </h3>

              <form onSubmit={handleExtract} className="space-y-4">
                {/* URL input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Target URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                    placeholder="https://www.amazon.com/product/..."
                    className={inputClass}
                  />
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Fields to Extract
                    </label>
                    <button
                      type="button"
                      onClick={addField}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600/60 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-slate-500/80 hover:text-white transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add Field
                    </button>
                  </div>

                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateFieldName(field.id, e.target.value)
                          }
                          disabled={loading}
                          placeholder="field_name"
                          className={cn(
                            inputClass,
                            "flex-1 font-mono text-xs",
                          )}
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateFieldType(field.id, e.target.value as FieldType)
                          }
                          disabled={loading}
                          className={cn(
                            inputClass,
                            "w-28 cursor-pointer text-xs",
                          )}
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t} value={t} className="bg-slate-900">
                              {t}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          disabled={loading}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/60 text-slate-500 hover:border-rose-500/40 hover:text-rose-400 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Instructions{" "}
                    <span className="normal-case font-normal text-slate-600">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    disabled={loading}
                    rows={2}
                    placeholder="Extract the current sale price, not the original price"
                    className={cn(inputClass, "resize-none")}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                    "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
                    "hover:from-cyan-400 hover:to-blue-500",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    "Extract Data"
                  )}
                </button>
              </form>
            </div>

            {/* Right panel — JSON output */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Extracted JSON</h3>

              <div className="relative">
                <div className="rounded-xl border border-slate-700/60 bg-slate-950/80 p-4 min-h-[260px] font-mono text-xs overflow-auto">
                  {loading ? (
                    <div className="space-y-2 pt-2">
                      <div className="h-2 w-1/3 animate-pulse rounded bg-slate-700/60" />
                      <div className="h-2 w-1/2 animate-pulse rounded bg-slate-700/50" />
                      <div className="h-2 w-2/5 animate-pulse rounded bg-slate-700/40" />
                      <div className="mt-4 h-2 w-3/5 animate-pulse rounded bg-slate-700/60" />
                      <div className="h-2 w-1/4 animate-pulse rounded bg-slate-700/50" />
                    </div>
                  ) : result ? (
                    <pre className="text-slate-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  ) : (
                    <pre className="text-slate-600">
                      {`// Your extracted data will appear here.\n// Define a schema and click "Extract Data".`}
                    </pre>
                  )}
                </div>

                {/* Schema preview (when no result yet) */}
                {!result && !loading && Object.keys(schemaPreview).length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Schema Preview
                    </p>
                    <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap">
                      {JSON.stringify(schemaPreview, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>

              {/* Copy as cURL */}
              <button
                type="button"
                onClick={handleCopyCurl}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/60 px-4 py-2 text-sm font-medium transition-all",
                  copied
                    ? "border-emerald-500/40 text-emerald-400"
                    : "text-slate-300 hover:border-slate-500/80 hover:text-white",
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy as cURL
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* API Reference tab */
        <div className="pt-5">
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/80 p-6">
            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-auto">
              {API_REFERENCE}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
