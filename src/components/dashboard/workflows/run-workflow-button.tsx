"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AutonomyModePanel } from "@/components/dashboard/workflows/autonomy-mode-panel";
import { SimulationPreviewPanel } from "@/components/dashboard/workflows/simulation-preview-panel";

type RunWorkflowButtonProps = {
  workflowId: string;
  disabled?: boolean;
};

export function RunWorkflowButton({ workflowId, disabled }: RunWorkflowButtonProps): JSX.Element {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAutonomyLoading, setIsAutonomyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<{
    id: string;
    status: "READY" | "FAILED";
    predictedPath: Array<{
      order: number;
      stepId: string;
      action: string;
      target?: string | null;
      selectorValid: boolean;
    }>;
    warnings: string[];
    createdAt: string;
  } | null>(null);
  const [autonomy, setAutonomy] = useState<{
    proposal: {
      adaptationVersion: number;
      notes?: string | null;
    } | null;
    selectorHistory: Array<{
      id: string;
      stepKey: string;
      originalSelector: string;
      alternativeSelector: string;
      failCount: number;
      confidence: number;
    }>;
  } | null>(null);

  async function onRunWorkflow() {
    setIsRunning(true);
    setError(null);

    const response = await fetch(`/api/internal/workflows/${workflowId}/execute`, {
      method: "POST",
    });

    setIsRunning(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Run failed");
      return;
    }

    router.refresh();
  }

  async function onSimulateWorkflow() {
    setIsSimulating(true);
    setError(null);
    const response = await fetch(`/api/internal/workflows/${workflowId}/simulate`, {
      method: "POST",
    });
    setIsSimulating(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Simulation failed");
      return;
    }

    const payload = (await response.json()) as {
      simulation: {
        id: string;
        status: "READY" | "FAILED";
        predictedPath: Array<{
          order: number;
          stepId: string;
          action: string;
          target?: string | null;
          selectorValid: boolean;
        }>;
        warnings: string[];
        createdAt: string;
      };
    };
    setSimulation(payload.simulation);
  }

  async function onAutonomyMode() {
    setIsAutonomyLoading(true);
    setError(null);
    const response = await fetch(`/api/internal/workflows/${workflowId}/autonomy`, {
      method: "POST",
    });
    setIsAutonomyLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Autonomy proposal failed");
      return;
    }

    const payload = (await response.json()) as {
      proposal: {
        adaptationVersion: number;
        notes?: string | null;
      } | null;
      selectorHistory: Array<{
        id: string;
        stepKey: string;
        originalSelector: string;
        alternativeSelector: string;
        failCount: number;
        confidence: number;
      }>;
    };
    setAutonomy(payload);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={onRunWorkflow} disabled={disabled || isRunning}>
          {isRunning ? "Running..." : "Run Now"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onSimulateWorkflow}
          disabled={disabled || isSimulating}
        >
          {isSimulating ? "Simulating..." : "Simulate"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onAutonomyMode}
          disabled={disabled || isAutonomyLoading}
        >
          {isAutonomyLoading ? "Learning..." : "Autonomy"}
        </Button>
      </div>
      {simulation ? <SimulationPreviewPanel simulation={simulation} /> : null}
      {autonomy ? <AutonomyModePanel payload={autonomy} /> : null}
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
