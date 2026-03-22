"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AgentOption = {
  id: string;
  name: string;
};

type DeployAgentModalProps = {
  agents: AgentOption[];
};

export function DeployAgentModal({ agents }: DeployAgentModalProps): JSX.Element {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [desiredRuns, setDesiredRuns] = useState("1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isOpen]);

  async function onDeploy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!agentId) {
      setError("Select an agent to deploy.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/internal/mission-control/deployments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        desiredRuns: Number(desiredRuns),
        notes: notes.trim() || undefined,
      }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to deploy agent.");
      return;
    }

    setIsOpen(false);
    setDesiredRuns("1");
    setNotes("");
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Deploy Agent
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white">Deploy Agent</h2>
            <p className="mt-1 text-sm text-slate-400">Set desired scale and push this agent into active fleet rotation.</p>

            <form className="mt-5 space-y-4" onSubmit={onDeploy}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300" htmlFor="deploy-agent-id">
                  Agent
                </label>
                <select
                  id="deploy-agent-id"
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-700/60 bg-slate-800/60 text-white focus:border-cyan-500/60 focus:ring-cyan-500/30 px-3 text-sm"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300" htmlFor="deploy-desired-runs">
                  Desired Parallel Runs
                </label>
                <input
                  id="deploy-desired-runs"
                  type="number"
                  min={1}
                  max={100}
                  value={desiredRuns}
                  onChange={(event) => setDesiredRuns(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-700/60 bg-slate-800/60 text-white placeholder-slate-500 focus:border-cyan-500/60 focus:ring-cyan-500/30 px-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300" htmlFor="deploy-notes">
                  Notes
                </label>
                <textarea
                  id="deploy-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-20 w-full rounded-md border border-slate-700/60 bg-slate-800/60 text-white placeholder-slate-500 focus:border-cyan-500/60 focus:ring-cyan-500/30 px-3 py-2 text-sm"
                  placeholder="Deployment rationale, rollout constraints, escalation owner."
                />
              </div>

              {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Deploying..." : "Deploy"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
