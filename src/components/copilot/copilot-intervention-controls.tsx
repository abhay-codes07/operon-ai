"use client";

import { useState } from "react";

type CoPilotInterventionControlsProps = {
  sessionId: string;
  runId: string;
  stepId: string;
  confidence: number;
  suggestedAction: string;
  ghostCursor: { x: number; y: number };
};

export function CoPilotInterventionControls(props: CoPilotInterventionControlsProps) {
  const [overrideAction, setOverrideAction] = useState(props.suggestedAction);
  const [status, setStatus] = useState<string | null>(null);

  async function confirmSuggestedAction() {
    const response = await fetch("/api/copilot/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: props.sessionId,
        runId: props.runId,
        stepId: props.stepId,
        action: props.suggestedAction,
        confidence: props.confidence,
      }),
    });
    setStatus(response.ok ? "Action confirmed" : "Confirmation failed");
  }

  async function submitOverride() {
    const response = await fetch("/api/copilot/intervene", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: props.sessionId,
        runId: props.runId,
        stepId: props.stepId,
        agentConfidence: props.confidence,
        agentSuggestedAction: props.suggestedAction,
        humanAction: overrideAction,
        interventionType: overrideAction.includes("input") ? "OVERRIDE_INPUT" : "OVERRIDE_CLICK",
      }),
    });
    setStatus(response.ok ? "Override submitted" : "Override failed");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Ghost Cursor & Intervention</h2>
      <p className="mt-1 text-sm text-slate-600">
        Co-Pilot suggests: <span className="font-semibold">{props.suggestedAction}</span>
      </p>
      <p className="text-xs text-slate-600">Confidence {Math.round(props.confidence * 100)}%</p>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        Ghost cursor position: ({props.ghostCursor.x}, {props.ghostCursor.y})
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void confirmSuggestedAction()}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
        >
          Confirm Ghost Action
        </button>
      </div>
      <label className="mt-3 block space-y-1 text-sm text-slate-700">
        <span>Override action</span>
        <input
          value={overrideAction}
          onChange={(event) => setOverrideAction(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="button"
        onClick={() => void submitOverride()}
        className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
      >
        Submit Override
      </button>
      {status ? <p className="mt-2 text-xs text-slate-600">{status}</p> : null}
    </section>
  );
}
