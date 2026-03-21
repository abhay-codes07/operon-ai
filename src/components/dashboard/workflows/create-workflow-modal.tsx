"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Sparkles, PenLine, Loader2 } from "lucide-react";

import { isCronExpressionValid, normalizeCronExpression } from "@/lib/utils/cron";
import { Button } from "@/components/ui/button";

type AgentOption = { id: string; name: string };

type ValidationIssues = {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

type GeneratedWorkflow = {
  name?: string;
  description?: string;
  naturalLanguageTask?: string;
  targetUrl?: string;
  guardrails?: string[];
  timeoutSeconds?: number;
  retryLimit?: number;
  scheduleCron?: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors";
const textareaClass =
  "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5";

export function CreateWorkflowModal({ agents }: { agents: AgentOption[] }): JSX.Element {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);

  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [naturalLanguageTask, setNaturalLanguageTask] = useState("");
  const [scheduleCron, setScheduleCron] = useState("");
  const [guardrailsText, setGuardrailsText] = useState("");
  const [timeoutSeconds, setTimeoutSeconds] = useState("300");
  const [retryLimit, setRetryLimit] = useState("1");

  function resetForm() {
    setAgentId("");
    setName("");
    setDescription("");
    setTargetUrl("");
    setNaturalLanguageTask("");
    setScheduleCron("");
    setGuardrailsText("");
    setTimeoutSeconds("300");
    setRetryLimit("1");
    setAiDescription("");
    setAiGenerated(false);
    setError(null);
    setMode("ai");
  }

  function close() {
    setIsOpen(false);
    resetForm();
  }

  async function handleGenerate() {
    if (aiDescription.trim().length < 10) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = (await res.json()) as GeneratedWorkflow;
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setNaturalLanguageTask(data.naturalLanguageTask ?? "");
      setTargetUrl(data.targetUrl ?? "");
      setGuardrailsText((data.guardrails ?? []).join("\n"));
      setTimeoutSeconds(String(data.timeoutSeconds ?? 300));
      setRetryLimit(String(data.retryLimit ?? 1));
      setScheduleCron(data.scheduleCron ?? "");
      setAiGenerated(true);
      setMode("manual");
    } catch {
      setError("AI generation failed. You can fill the form manually.");
    } finally {
      setIsGenerating(false);
    }
  }

  function normalizeTargetUrlInput(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  const canSubmit = useMemo(
    () => agentId && name.trim().length >= 2 && naturalLanguageTask.trim().length >= 10,
    [agentId, name, naturalLanguageTask],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsedTimeout = Number(timeoutSeconds);
    const parsedRetry = Number(retryLimit);
    const normalizedCron = normalizeCronExpression(scheduleCron);
    if (!Number.isInteger(parsedTimeout) || parsedTimeout < 30 || parsedTimeout > 3600) {
      setError("Timeout must be between 30 and 3600 seconds.");
      return;
    }
    if (!Number.isInteger(parsedRetry) || parsedRetry < 0 || parsedRetry > 5) {
      setError("Retry limit must be 0–5.");
      return;
    }
    if (normalizedCron && !isCronExpressionValid(normalizedCron)) {
      setError("Schedule cron must be a valid 5-field cron expression.");
      return;
    }
    const normalizedTargetUrl = normalizeTargetUrlInput(targetUrl);
    if (normalizedTargetUrl) {
      try { new URL(normalizedTargetUrl); } catch {
        setError("Target URL is invalid.");
        return;
      }
    }
    setIsSubmitting(true);
    const response = await fetch("/api/internal/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        name: name.trim(),
        description: description.trim() || undefined,
        targetUrl: normalizedTargetUrl,
        naturalLanguageTask: naturalLanguageTask.trim(),
        scheduleCron: normalizedCron,
        timeoutSeconds: parsedTimeout,
        retryLimit: parsedRetry,
        guardrails: guardrailsText.split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setIsSubmitting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; issues?: ValidationIssues }
        | null;
      const fieldError = payload?.issues?.fieldErrors
        ? Object.values(payload.issues.fieldErrors).find(
            (e): e is string[] => Array.isArray(e) && e.length > 0,
          )?.[0]
        : undefined;
      setError(fieldError ?? payload?.issues?.formErrors?.[0] ?? payload?.error ?? "Unable to create workflow.");
      return;
    }
    close();
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        Create Workflow
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-slate-950/80">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">New Workflow</h2>
                <p className="mt-0.5 text-xs text-slate-500">Describe your task or fill manually</p>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 border-b border-slate-700/60 px-6 pt-3">
              <button
                onClick={() => setMode("ai")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
                  mode === "ai"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Builder
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
                  mode === "manual"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                Manual
                {aiGenerated ? (
                  <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    FILLED
                  </span>
                ) : null}
              </button>
            </div>

            <div className="p-6">
              {/* AI tab */}
              {mode === "ai" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <p className="text-xs font-semibold text-cyan-400">Just describe what you want the agent to do</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Plain English works. Mention sites, data needed, or how often it should run.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Task Description</label>
                    <textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      className={`${textareaClass} min-h-36`}
                      placeholder={
                        "Examples:\n• Check iPhone 15 Pro prices on Amazon, eBay and Walmart every morning\n• Find entry-level software jobs on LinkedIn posted today\n• Monitor competitor pricing on Shopify and report changes weekly"
                      }
                    />
                  </div>
                  {error ? (
                    <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" type="button" onClick={close}>Cancel</Button>
                    <Button
                      type="button"
                      disabled={aiDescription.trim().length < 10 || isGenerating}
                      onClick={handleGenerate}
                    >
                      {isGenerating ? (
                        <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generating...</>
                      ) : (
                        <><Sparkles className="mr-1.5 h-3.5 w-3.5" />Generate Workflow</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Manual / review form */
                <form className="space-y-4" onSubmit={onSubmit}>
                  {aiGenerated ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
                      <p className="text-xs font-semibold text-emerald-400">
                        ✓ AI-generated — review and adjust before creating
                      </p>
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Agent</label>
                      <select
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        className={inputClass}
                        required
                      >
                        <option value="">Select an agent</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Workflow Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Daily Invoice Validation" required />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Target Website URL (Optional)</label>
                    <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} className={inputClass} placeholder="https://www.amazon.com" />
                  </div>

                  <div>
                    <label className={labelClass}>Task Description (Natural Language)</label>
                    <textarea value={naturalLanguageTask} onChange={(e) => setNaturalLanguageTask(e.target.value)} className={`${textareaClass} min-h-28`} placeholder="Describe what the agent should do." required />
                  </div>

                  <div>
                    <label className={labelClass}>Description (Optional)</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Reconciliation flow for AP operations" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Schedule Cron (Optional)</label>
                      <input value={scheduleCron} onChange={(e) => setScheduleCron(e.target.value)} className={inputClass} placeholder="0 9 * * 1-5  (weekdays 9am)" />
                    </div>
                    <div>
                      <label className={labelClass}>Retry Limit</label>
                      <input type="number" value={retryLimit} onChange={(e) => setRetryLimit(e.target.value)} className={inputClass} min={0} max={5} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Guardrails (one per line)</label>
                    <textarea value={guardrailsText} onChange={(e) => setGuardrailsText(e.target.value)} className={`${textareaClass} min-h-20`} placeholder={"Do not submit payment forms\nScreenshot at each step"} />
                  </div>

                  <div>
                    <label className={labelClass}>Timeout (seconds)</label>
                    <input type="number" value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(e.target.value)} className={inputClass} min={30} max={3600} />
                  </div>

                  {error ? (
                    <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>
                  ) : null}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={close} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Workflow"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
