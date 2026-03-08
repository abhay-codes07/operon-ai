import Link from "next/link";

import { PipelineCreateForm } from "@/components/pipelines/pipeline-create-form";
import { PipelineStatusBadge } from "@/components/pipelines/pipeline-status-badge";
import { PipelineStatsPanel } from "@/components/pipelines/pipeline-stats-panel";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { listPipelines } from "@/lib/pipeline/pipeline.service";
import { getPipelineStats } from "@/lib/pipeline/metrics.service";

export default async function PipelinesPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [agents, pipelines, stats] = await Promise.all([
    fetchAgentCatalog({
      organizationId: user.organizationId!,
      page: 1,
      pageSize: 100,
      status: "ACTIVE",
    }),
    listPipelines({ orgId: user.organizationId! }),
    getPipelineStats(user.organizationId!),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operon Pipelines</p>
        <h1 className="text-2xl font-semibold text-slate-900">Multi-Agent Orchestration</h1>
        <p className="text-sm text-slate-600">Coordinate autonomous web agents as durable step chains.</p>
      </header>

      <PipelineStatsPanel initialStats={stats} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Pipelines</h2>
          {pipelines.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No pipelines configured yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {pipelines.map((pipeline) => (
                <Link
                  key={pipeline.id}
                  href={`/pipelines/${pipeline.id}`}
                  className="block rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
                >
                  <p className="text-sm font-semibold text-slate-900">{pipeline.name}</p>
                  <p className="text-xs text-slate-600">{pipeline.description ?? "No description"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-slate-500">{pipeline.steps.length} step(s)</p>
                    {pipeline.runs[0]?.status ? (
                      <PipelineStatusBadge status={pipeline.runs[0].status} />
                    ) : (
                      <span className="text-xs text-slate-500">Never run</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <PipelineCreateForm
          agents={agents.items.map((agent) => ({
            id: agent.id,
            name: agent.name,
          }))}
        />
      </div>
    </div>
  );
}
