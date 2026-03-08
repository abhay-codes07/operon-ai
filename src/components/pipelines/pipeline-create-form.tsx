"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AgentOption = {
  id: string;
  name: string;
};

type PipelineCreateFormProps = {
  agents: AgentOption[];
};

type StepDraft = {
  agentId: string;
  stepOrder: number;
};

export function PipelineCreateForm({ agents }: PipelineCreateFormProps): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([{ agentId: agents[0]?.id ?? "", stepOrder: 1 }]);
  const [state, setState] = useState<{ loading: boolean; error?: string }>({ loading: false });

  const canSubmit = useMemo(
    () => name.trim().length >= 2 && steps.every((step) => step.agentId),
    [name, steps],
  );

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        agentId: agents[0]?.id ?? "",
        stepOrder: current.length + 1,
      },
    ]);
  }

  async function onSubmit() {
    setState({ loading: true });
    const response = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        steps: steps.map((step, index) => ({
          agentId: step.agentId,
          stepOrder: index + 1,
          inputMapping: {},
          outputMapping: {},
        })),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { pipeline?: { id: string }; error?: { message?: string } }
      | null;
    if (!response.ok || !payload?.pipeline) {
      setState({
        loading: false,
        error: payload?.error?.message ?? "Failed to create pipeline",
      });
      return;
    }

    router.push(`/pipelines/${payload.pipeline.id}`);
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Create Pipeline</h2>
      <p className="text-xs text-slate-600">Chain multiple agents into one coordinated run.</p>

      <div className="mt-4 space-y-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            placeholder="Revenue Recovery Pipeline"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Describe pipeline objective"
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">Steps</p>
          {steps.map((step, index) => (
            <div key={index} className="rounded-md border border-slate-200 p-2">
              <p className="mb-1 text-xs text-slate-500">Step {index + 1}</p>
              <select
                value={step.agentId}
                onChange={(event) =>
                  setSteps((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, agentId: event.target.value } : item,
                    ),
                  )
                }
                className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={addStep}>
            Add Step
          </Button>
        </div>

        <Button type="button" onClick={onSubmit} disabled={!canSubmit || state.loading}>
          {state.loading ? "Creating..." : "Create Pipeline"}
        </Button>
        {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
      </div>
    </section>
  );
}
