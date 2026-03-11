"use client";

import Link from "next/link";
import { useState } from "react";

import { WorkflowReviewPanel } from "@/components/autopilot/workflow-review-panel";

type ActionType = "NAVIGATE" | "CLICK" | "INPUT" | "EXTRACT" | "WAIT" | "CUSTOM";

type CompiledDefinition = {
  domain: string;
  generatedAt: string;
  steps: Array<{
    order: number;
    type: "navigate" | "click" | "input" | "extract" | "wait" | "custom";
    selector?: string;
    value?: string;
    url?: string;
    parameterKey?: string;
  }>;
};

export function LearnModePanel() {
  const [domain, setDomain] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [actionType, setActionType] = useState<ActionType>("CLICK");
  const [selector, setSelector] = useState("");
  const [value, setValue] = useState("");

  const [reviewDefinition, setReviewDefinition] = useState<CompiledDefinition | null>(null);
  const [createdWorkflowId, setCreatedWorkflowId] = useState<string | null>(null);
  const [simFailedSelector, setSimFailedSelector] = useState("");
  const [simCandidates, setSimCandidates] = useState("");
  const [simResult, setSimResult] = useState<string | null>(null);

  async function startSession() {
    setError(null);
    setStatus("Starting session...");
    setReviewDefinition(null);
    setCreatedWorkflowId(null);

    const response = await fetch("/api/autopilot/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ domain }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { session?: { id: string; domain: string }; error?: { message?: string } }
      | null;

    if (!response.ok || !payload?.session) {
      setStatus(null);
      setError(payload?.error?.message ?? "Failed to start session.");
      return;
    }

    setSessionId(payload.session.id);
    setStatus(`Recording ${payload.session.domain}`);
  }

  async function captureAction() {
    if (!sessionId) {
      return;
    }

    setError(null);
    const response = await fetch("/api/autopilot/action", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        actionType,
        selector: selector || undefined,
        value: value || undefined,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { action?: { id: string }; error?: { message?: string } }
      | null;
    if (!response.ok || !payload?.action) {
      setError(payload?.error?.message ?? "Failed to capture action.");
      return;
    }

    setStatus(`Action captured: ${actionType}`);
    setSelector("");
    setValue("");
  }

  async function stopAndCompile() {
    if (!sessionId) {
      return;
    }

    setError(null);
    setStatus("Compiling workflow...");

    const response = await fetch("/api/autopilot/finish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ sessionId, approve: false }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { compiled?: CompiledDefinition; error?: { message?: string } }
      | null;
    if (!response.ok || !payload?.compiled) {
      setError(payload?.error?.message ?? "Failed to compile workflow.");
      setStatus(null);
      return;
    }

    setReviewDefinition(payload.compiled);
    setStatus("Workflow compiled. Review and approve.");
  }

  async function simulateRepair() {
    setSimResult(null);
    const candidateSelectors = simCandidates
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch("/api/autopilot/repair/simulate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        domain: domain || "example.com",
        failedSelector: simFailedSelector,
        candidateSelectors,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          result?: { repaired?: boolean; selector?: string; strategy?: string; confidence?: number; reason?: string };
          valid?: boolean;
          error?: { message?: string };
        }
      | null;

    if (!response.ok) {
      setSimResult(payload?.error?.message ?? "Repair simulation failed");
      return;
    }

    if (!payload?.result) {
      setSimResult("No repair result");
      return;
    }

    if (!payload.result.repaired) {
      setSimResult(`No repair found (${payload.result.reason ?? "unknown_reason"})`);
      return;
    }

    setSimResult(
      `Repaired to ${payload.result.selector ?? "n/a"} using ${payload.result.strategy ?? "unknown"} at ${
        Math.round((payload.result.confidence ?? 0) * 100)
      }% confidence`,
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900">Learn Mode Recorder</h2>
          <p className="text-sm text-slate-600">Record user actions once and compile a reusable workflow.</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
            <span>Domain</span>
            <input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="app.example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void startSession()}
              disabled={!domain.trim()}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Start Recording
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action Capture</p>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-sm text-slate-700">
              <span>Action</span>
              <select
                value={actionType}
                onChange={(event) => setActionType(event.target.value as ActionType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="NAVIGATE">NAVIGATE</option>
                <option value="CLICK">CLICK</option>
                <option value="INPUT">INPUT</option>
                <option value="EXTRACT">EXTRACT</option>
                <option value="WAIT">WAIT</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
              <span>Selector</span>
              <input
                value={selector}
                onChange={(event) => setSelector(event.target.value)}
                placeholder="#login-button"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Value</span>
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="optional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void captureAction()}
              disabled={!sessionId}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Capture Action
            </button>
            <button
              type="button"
              onClick={() => void stopAndCompile()}
              disabled={!sessionId}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              Stop and Compile
            </button>
          </div>
        </div>

        {status ? <p className="mt-3 text-sm text-slate-700">{status}</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </section>

      {reviewDefinition && sessionId ? (
        <WorkflowReviewPanel
          sessionId={sessionId}
          initialDefinition={reviewDefinition}
          onApproved={(workflowId) => {
            setCreatedWorkflowId(workflowId);
            setStatus("Workflow approved and saved.");
          }}
        />
      ) : null}

      {createdWorkflowId ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-900">Workflow saved successfully.</p>
          <Link href={`/dashboard/workflows`} className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline">
            Open Workflows
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900">Selector Repair Simulator</h2>
          <p className="text-sm text-slate-600">Validate fallback selector quality before running in production.</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span>Failed selector</span>
            <input
              value={simFailedSelector}
              onChange={(event) => setSimFailedSelector(event.target.value)}
              placeholder="#submit-button"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>Candidate selectors (one per line)</span>
            <textarea
              value={simCandidates}
              onChange={(event) => setSimCandidates(event.target.value)}
              placeholder="#submit-btn&#10;[data-testid='submit']&#10;button[type='submit']"
              className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void simulateRepair()}
            disabled={!simFailedSelector.trim()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Simulate Repair
          </button>
        </div>
        {simResult ? <p className="mt-3 text-sm text-slate-700">{simResult}</p> : null}
      </section>
    </div>
  );
}
