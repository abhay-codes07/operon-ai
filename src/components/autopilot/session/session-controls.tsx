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
    <div className="rounded-2xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
      <p className="text-sm font-semibold text-white">Operator Controls</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void callAction("approve")}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-xs font-semibold text-white"
        >
          Approve Session
        </button>
        <button
          type="button"
          onClick={() => void callAction("fail")}
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400"
        >
          Mark Failed
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-slate-400">{message}</p> : null}
    </div>
  );
}
