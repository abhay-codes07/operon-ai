import Link from "next/link";

import { AgentLiveView } from "@/components/dashboard/activity/agent-live-view";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionById } from "@/server/services/executions/execution-service";
import { fetchExecutionStream } from "@/server/services/control-plane/streaming-service";

type DashboardLiveExecutionPageProps = {
  params: {
    executionId: string;
  };
};

export default async function DashboardLiveExecutionPage({
  params,
}: DashboardLiveExecutionPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const execution = await fetchExecutionById({
    organizationId: user.organizationId!,
    executionId: params.executionId,
  });

  if (!execution) {
    return (
      <DashboardCard title="Execution Not Found">
        <p className="text-sm text-slate-600">No execution exists for this live session.</p>
      </DashboardCard>
    );
  }

  const stream = await fetchExecutionStream({
    organizationId: user.organizationId!,
    executionId: execution.id,
  });

  return (
    <div className="space-y-5">
      <Link href={`/dashboard/activity/${execution.id}`} className="text-sm text-slate-700 underline-offset-2 hover:underline">
        Back to Execution Detail
      </Link>
      <AgentLiveView
        organizationId={user.organizationId!}
        executionId={execution.id}
        initialEvents={stream.map((item) => ({
          sequence: item.sequence,
          eventType: item.eventType,
          payload: (item.payload as Record<string, unknown>) ?? {},
          occurredAt: item.occurredAt.toISOString(),
        }))}
      />
    </div>
  );
}
