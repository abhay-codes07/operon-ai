import Link from "next/link";

import { ExecutionDetailLivePanel } from "@/components/dashboard/activity/execution-detail-live-panel";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionReplay } from "@/server/services/executions/replay-service";
import { fetchExecutionById, fetchExecutionTimeline } from "@/server/services/executions/execution-service";
import { fetchSelfHealingTimeline } from "@/server/services/executions/self-healing-service";

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

  const [timeline, replay, selfHealingRecords] = await Promise.all([
    fetchExecutionTimeline({
      organizationId: user.organizationId!,
      executionId: execution.id,
      page: 1,
      pageSize: 100,
    }),
    fetchExecutionReplay({
      organizationId: user.organizationId!,
      executionId: execution.id,
    }),
    fetchSelfHealingTimeline({
      organizationId: user.organizationId!,
      executionId: execution.id,
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center">
        <Link href="/dashboard/activity" className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline">
          Back to Activity
        </Link>
      </div>
      <ExecutionDetailLivePanel
        initialExecution={execution}
        initialLogs={timeline.items.map((item) => ({
          ...item,
          occurredAt: item.occurredAt.toISOString(),
        }))}
        initialReplay={{
          steps: replay.steps,
          snapshots: replay.snapshots.map((item) => ({
            ...item,
            capturedAt: item.capturedAt.toISOString(),
          })),
        }}
        initialSelfHealingRecords={selfHealingRecords.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
