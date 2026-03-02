"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { isCronExpressionValid, normalizeCronExpression } from "@/lib/utils/cron";
import { Button } from "@/components/ui/button";

type AgentOption = {
  id: string;
  name: string;
};

type CreateWorkflowModalProps = {
  agents: AgentOption[];
};

export function CreateWorkflowModal({ agents }: CreateWorkflowModalProps): JSX.Element {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [naturalLanguageTask, setNaturalLanguageTask] = useState("");
  const [scheduleCron, setScheduleCron] = useState("");
  const [guardrailsText, setGuardrailsText] = useState("");
  const [timeoutSeconds, setTimeoutSeconds] = useState("300");
  const [retryLimit, setRetryLimit] = useState("1");

  const canSubmit = useMemo(() => {
    return agentId && name.trim().length >= 2 && naturalLanguageTask.trim().length >= 10;
  }, [agentId, name, naturalLanguageTask]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedTimeout = Number(timeoutSeconds);
    const parsedRetry = Number(retryLimit);
    const normalizedCron = normalizeCronExpression(scheduleCron);

    if (!Number.isInteger(parsedTimeout) || parsedTimeout < 30 || parsedTimeout > 3600) {
      setError("Timeout must be an integer between 30 and 3600 seconds.");
      return;
    }

    if (!Number.isInteger(parsedRetry) || parsedRetry < 0 || parsedRetry > 5) {
      setError("Retry limit must be an integer between 0 and 5.");
      return;
    }

    if (normalizedCron && !isCronExpressionValid(normalizedCron)) {
      setError("Schedule cron must be a valid 5-field cron expression.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/internal/workflows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        name: name.trim(),
        description: description.trim() || undefined,
        naturalLanguageTask: naturalLanguageTask.trim(),
        scheduleCron: normalizedCron,
        timeoutSeconds: parsedTimeout,
        retryLimit: parsedRetry,
        guardrails: guardrailsText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to create workflow.");
      return;
    }

    setIsOpen(false);
    setAgentId("");
    setName("");
    setDescription("");
    setNaturalLanguageTask("");
    setScheduleCron("");
    setGuardrailsText("");
    setTimeoutSeconds("300");
    setRetryLimit("1");
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create Workflow</Button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">New Workflow</h2>
            <p className="mt-1 text-sm text-slate-600">Describe the task in natural language and configure execution controls.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Agent</label>
                  <select
                    value={agentId}
                    onChange={(event) => setAgentId(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                    required
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Workflow Name</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                    placeholder="Daily Invoice Validation"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Task Description (Natural Language)</label>
                <textarea
                  value={naturalLanguageTask}
                  onChange={(event) => setNaturalLanguageTask(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Log into vendor portal, download yesterday invoices, reconcile mismatches, and notify finance."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                  placeholder="Reconciliation flow for AP operations"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Schedule Cron (Optional)</label>
                  <input
                    value={scheduleCron}
                    onChange={(event) => setScheduleCron(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                    placeholder="0 7 * * 1-5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Retry Limit</label>
                  <input
                    type="number"
                    value={retryLimit}
                    onChange={(event) => setRetryLimit(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                    min={0}
                    max={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Guardrails (one per line)</label>
                <textarea
                  value={guardrailsText}
                  onChange={(event) => setGuardrailsText(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder={"Never submit destructive actions without confirmation\nCapture screenshot at each step"}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Timeout (seconds)</label>
                <input
                  type="number"
                  value={timeoutSeconds}
                  onChange={(event) => setTimeoutSeconds(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                  min={30}
                  max={3600}
                />
              </div>

              {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Workflow"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
