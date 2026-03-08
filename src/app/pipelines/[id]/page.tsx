import Link from "next/link";
import { notFound } from "next/navigation";

import { PipelineCanvas } from "@/components/pipelines/pipeline-canvas";
import { PipelineRunControls } from "@/components/pipelines/pipeline-run-controls";
import { PipelineStepConfigForm } from "@/components/pipelines/pipeline-step-config-form";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { getPipelineById } from "@/lib/pipeline/pipeline.service";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";

type PipelineDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function PipelineDetailPage({
  params,
}: PipelineDetailPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [pipeline, agents] = await Promise.all([
    getPipelineById(user.organizationId!, params.id),
    fetchAgentCatalog({
      organizationId: user.organizationId!,
      page: 1,
      pageSize: 100,
      status: "ACTIVE",
    }),
  ]);
  if (!pipeline) {
    notFound();
  }

  const latestRun = pipeline.runs[0];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pipeline Detail</p>
        <h1 className="text-2xl font-semibold text-slate-900">{pipeline.name}</h1>
        <p className="text-sm text-slate-600">{pipeline.description ?? "No description provided."}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <p>Steps: {pipeline.steps.length}</p>
            <p>Latest Run: {latestRun?.status ?? "Never run"}</p>
          </div>
          <div className="flex items-center gap-2">
            <PipelineRunControls
              pipelineId={pipeline.id}
              latestRunId={latestRun?.id ?? null}
              latestRunStatus={latestRun?.status ?? null}
            />
            <Link
              href={`/pipelines/${pipeline.id}/runs`}
              className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700"
            >
              View Runs
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr,1fr]">
        <PipelineCanvas
          steps={pipeline.steps.map((step) => ({
            id: step.id,
            stepOrder: step.stepOrder,
            agentId: step.agentId,
            agentName: step.agent.name,
            inputMapping: (step.inputMapping as Record<string, unknown> | null) ?? {},
            outputMapping: (step.outputMapping as Record<string, unknown> | null) ?? {},
          }))}
        />
        <PipelineStepConfigForm
          pipelineId={pipeline.id}
          agents={agents.items.map((agent) => ({ id: agent.id, name: agent.name }))}
          nextStepOrder={pipeline.steps.length + 1}
        />
      </div>
    </div>
  );
}
