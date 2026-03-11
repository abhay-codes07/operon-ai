"use client";

import { useState } from "react";

type SessionControlsProps = {
  sessionId: string;
};

export function SessionControls({ sessionId }: SessionControlsProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function callAction(action: "approve" | "fail") {
    setMessage(null);
    const response = await fetch(`/api/autopilot/session/${sessionId}/${action}`, { method: "POST" });
    if (!response.ok) {
      setMessage("Action failed");
      return;
    }
    setMessage(action === "approve" ? "Session approved" : "Session marked failed");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Operator Controls</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void callAction("approve")}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
        >
          Approve Session
        </button>
        <button
          type="button"
          onClick={() => void callAction("fail")}
          className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700"
        >
          Mark Failed
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
