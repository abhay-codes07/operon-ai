"use client";

import { useEffect } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function EmergencyStopButton(): JSX.Element {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshState() {
    const response = await fetch("/api/internal/system/kill-switch", { cache: "no-store" });
    if (!response.ok) {
      setError("Unavailable");
      return;
    }

    const payload = (await response.json()) as { enabled: boolean };
    setEnabled(payload.enabled);
    setError(null);
  }

  async function toggle() {
    setIsSaving(true);
    await fetch("/api/internal/system/kill-switch", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: !(enabled ?? true),
        reason: "Manual control-plane action",
      }),
    });
    setIsSaving(false);
    await refreshState();
  }

  useEffect(() => {
    void refreshState();
  }, []);

  return error ? (
    <p className="text-xs text-rose-700">{error}</p>
  ) : (
    <Button type="button" variant="ghost" onClick={toggle} disabled={isSaving || enabled === null}>
      {isSaving ? "Updating..." : enabled ? "Emergency Stop" : "Resume Agents"}
    </Button>
  );
}
