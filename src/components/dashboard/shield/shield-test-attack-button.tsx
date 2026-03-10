"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShieldTestAttackButton(): JSX.Element {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runTest() {
    setRunning(true);
    setMessage(null);
    try {
      const response = await fetch("/api/shield/test-injection", {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error?.message ?? "Failed to run demo injection");
        return;
      }
      setMessage("Demo injection event generated.");
    } catch {
      setMessage("Network error while triggering demo injection.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" onClick={runTest} disabled={running}>
        {running ? "Running..." : "Run Demo Attack"}
      </Button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
