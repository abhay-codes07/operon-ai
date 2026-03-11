"use client";

import { useMemo, useState } from "react";

type CompiledStep = {
  order: number;
  type: "navigate" | "click" | "input" | "extract" | "wait" | "custom";
  selector?: string;
  value?: string;
  url?: string;
  parameterKey?: string;
};

type CompiledDefinition = {
  domain: string;
  generatedAt: string;
  steps: CompiledStep[];
};

type WorkflowReviewPanelProps = {
  sessionId: string;
  initialDefinition: CompiledDefinition;
  onApproved: (workflowId: string | null) => void;
};

export function WorkflowReviewPanel({ sessionId, initialDefinition, onApproved }: WorkflowReviewPanelProps) {
  const [name, setName] = useState(`Autopilot ${initialDefinition.domain}`);
  const [description, setDescription] = useState("Generated from Operon Autopilot learn mode");
  const [json, setJson] = useState(JSON.stringify(initialDefinition, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stepCount = useMemo(() => initialDefinition.steps.length, [initialDefinition.steps.length]);

  async function approveWorkflow() {
    setBusy(true);
    setError(null);

    let editedDefinition: CompiledDefinition;
    try {
      editedDefinition = JSON.parse(json) as CompiledDefinition;
    } catch {
      setBusy(false);
      setError("Workflow JSON is invalid.");
      return;
    }

    const response = await fetch("/api/autopilot/finish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        approve: true,
        name,
        description,
        editedDefinition,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          generatedWorkflowId?: string | null;
          error?: {
            message?: string;
          };
        }
      | null;

    setBusy(false);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Failed to approve workflow.");
      return;
    }

    onApproved(payload?.generatedWorkflowId ?? null);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900">Workflow Review</h2>
        <p className="text-sm text-slate-600">{stepCount} steps generated. Edit before approval.</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700">
          <span>Workflow name</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Description</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block space-y-1 text-sm text-slate-700">
        <span>Compiled workflow JSON</span>
        <textarea
          className="h-72 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          value={json}
          onChange={(event) => setJson(event.target.value)}
        />
      </label>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void approveWorkflow()}
          disabled={busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {busy ? "Saving..." : "Approve and Save"}
        </button>
      </div>
    </section>
  );
}
