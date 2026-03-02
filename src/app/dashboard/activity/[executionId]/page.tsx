import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ExecutionLogTimeline } from "@/components/dashboard/activity/execution-log-timeline";
import { ExecutionStatusBadge } from "@/components/dashboard/status/execution-status-badge";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionById, fetchExecutionTimeline } from "@/server/services/executions/execution-service";

type DashboardExecutionDetailPageProps = {
  params: {
    executionId: string;
  };
};

export default async function DashboardExecutionDetailPage({
  params,
}: DashboardExecutionDetailPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const execution = await fetchExecutionById({
    organizationId: user.organizationId!,
    executionId: params.executionId,
  });

  if (!execution) {
    return (
      <DashboardCard title="Execution Not Found">
        <p className="text-sm text-slate-600">No execution exists with the provided identifier.</p>
      </DashboardCard>
    );
  }

  const timeline = await fetchExecutionTimeline({
    organizationId: user.organizationId!,
    executionId: execution.id,
    page: 1,
    pageSize: 100,
  });

  return (
    <div className="space-y-5">
      <DashboardCard title={`Execution ${execution.id.slice(-8)}`} description="Detailed execution telemetry">
        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</p>
            <div className="mt-2">
              <ExecutionStatusBadge status={execution.status} />
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Trigger</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{execution.trigger}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Agent</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{execution.agentId.slice(-8)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Workflow</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{execution.workflowId?.slice(-8) ?? "N/A"}</p>
          </article>
        </div>

        {execution.errorMessage ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Error</p>
            <p className="mt-1 text-sm text-rose-700">{execution.errorMessage}</p>
          </div>
        ) : null}

        {execution.outputPayload ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Output Payload</p>
            <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
              {JSON.stringify(execution.outputPayload, null, 2)}
            </pre>
          </div>
        ) : null}
      </DashboardCard>

      <DashboardCard title="Execution Timeline" description="Ordered events emitted during processing">
        <ExecutionLogTimeline logs={timeline.items} />
      </DashboardCard>
    </div>
  );
}
