"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function EmergencyStopButton(): JSX.Element {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function refreshState() {
    const response = await fetch("/api/internal/system/kill-switch", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { enabled: boolean };
    setEnabled(payload.enabled);
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

  if (enabled === null) {
    void refreshState();
  }

  return (
    <Button type="button" variant="ghost" onClick={toggle} disabled={isSaving}>
      {isSaving ? "Updating..." : enabled ? "Emergency Stop" : "Resume Agents"}
    </Button>
  );
}
