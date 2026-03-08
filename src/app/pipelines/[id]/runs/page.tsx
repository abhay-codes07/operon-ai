import Link from "next/link";
import { notFound } from "next/navigation";

import { PipelineStepRunActions } from "@/components/pipelines/pipeline-step-run-actions";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { getPipelineById } from "@/lib/pipeline/pipeline.service";

type PipelineRunsPageProps = {
  params: {
    id: string;
  };
};

export default async function PipelineRunsPage({
  params,
}: PipelineRunsPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const pipeline = await getPipelineById(user.organizationId!, params.id);
  if (!pipeline) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pipeline Monitor</p>
        <h1 className="text-2xl font-semibold text-slate-900">{pipeline.name} Runs</h1>
        <p className="text-sm text-slate-600">Track status, step progression, and linked agent executions.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <Link href={`/pipelines/${pipeline.id}`} className="text-sm font-medium text-slate-700 hover:underline">
          ← Back to Pipeline
        </Link>
      </section>

      {pipeline.runs.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">No pipeline runs yet.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {pipeline.runs.map((run) => (
            <section key={run.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">Run {run.id.slice(-8)}</p>
                <span className="text-xs font-semibold text-slate-600">{run.status}</span>
              </div>
              <p className="text-xs text-slate-500">
                Started {new Date(run.startedAt).toLocaleString()}
                {run.completedAt ? ` • Completed ${new Date(run.completedAt).toLocaleString()}` : ""}
              </p>
              {run.errorMessage ? <p className="mt-1 text-xs text-rose-700">{run.errorMessage}</p> : null}

              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 bg-white">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Step</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Agent Run</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Timing</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {run.stepRuns.map((stepRun) => (
                      <tr key={stepRun.id}>
                        <td className="px-3 py-2 text-xs text-slate-900">Step {stepRun.step.stepOrder}</td>
                        <td className="px-3 py-2 text-xs font-medium text-slate-700">{stepRun.status}</td>
                        <td className="px-3 py-2 text-xs text-slate-700">
                          {stepRun.agentRun ? (
                            <Link
                              href={`/dashboard/activity/${stepRun.agentRun.id}`}
                              className="text-slate-700 underline"
                            >
                              {stepRun.agentRun.id.slice(-8)} ({stepRun.agentRun.status})
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {stepRun.startedAt ? new Date(stepRun.startedAt).toLocaleTimeString() : "-"} →{" "}
                          {stepRun.completedAt ? new Date(stepRun.completedAt).toLocaleTimeString() : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <PipelineStepRunActions
                            pipelineRunId={run.id}
                            stepRunId={stepRun.id}
                            status={stepRun.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
