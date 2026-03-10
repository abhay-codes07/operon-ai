"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";
import { ShieldSeverityBadge } from "@/components/dashboard/shield/shield-severity-badge";

type WorkflowShieldStatus = {
  baselineConfigured: boolean;
  lastThreat: {
    id: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    detectedAt: string;
  } | null;
};

type WorkflowShieldStatusProps = {
  workflowId: string;
  initial: WorkflowShieldStatus;
};

export function WorkflowShieldStatus({ workflowId, initial }: WorkflowShieldStatusProps): JSX.Element {
  const [status, setStatus] = useState(initial);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/shield/workflows/${workflowId}/status`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { status: WorkflowShieldStatus };
    setStatus(payload.status);
  }, [workflowId]);

  usePolling(refresh, 15_000, true);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
          status.baselineConfigured
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        {status.baselineConfigured ? "Baseline Active" : "Baseline Missing"}
      </span>
      {status.lastThreat ? (
        <ShieldSeverityBadge severity={status.lastThreat.severity} />
      ) : (
        <span className="text-xs text-slate-500">No recent threat</span>
      )}
    </div>
  );
}
