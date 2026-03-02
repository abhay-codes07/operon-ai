import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ExecutionLogTimeline } from "@/components/dashboard/activity/execution-log-timeline";
import { ExecutionTimelineList } from "@/components/dashboard/activity/execution-timeline-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionHistory, fetchExecutionTimeline } from "@/server/services/executions/execution-service";

export default async function DashboardActivityPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const executionHistory = await fetchExecutionHistory({
    organizationId: user.organizationId!,
    page: 1,
    pageSize: 12,
  });

  const latestExecution = executionHistory.items[0];
  const timeline = latestExecution
    ? await fetchExecutionTimeline({
        organizationId: user.organizationId!,
        executionId: latestExecution.id,
        page: 1,
        pageSize: 20,
      })
    : { items: [] as Array<{ id: string; level: "DEBUG" | "INFO" | "WARN" | "ERROR"; message: string; occurredAt: Date }> };

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Execution Activity"
        title="Real-Time Activity Timeline"
        description="Track execution lifecycle events and inspect logs emitted by autonomous web workflows."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr,1fr]">
        <DashboardCard title="Recent Executions" description="Most recent runs across all workflow triggers.">
          <ExecutionTimelineList items={executionHistory.items} />
        </DashboardCard>

        <DashboardCard
          title="Execution Log Stream"
          description={latestExecution ? `Latest execution: ${latestExecution.id.slice(-8)}` : "No executions yet"}
        >
          <ExecutionLogTimeline logs={timeline.items} />
        </DashboardCard>
      </div>
    </div>
  );
}
