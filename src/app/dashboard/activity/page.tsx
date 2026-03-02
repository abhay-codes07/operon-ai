import { ActivityLivePanel } from "@/components/dashboard/activity/activity-live-panel";
import { StatusFilter } from "@/components/dashboard/layout/status-filter";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionHistory, fetchExecutionTimeline } from "@/server/services/executions/execution-service";

type DashboardActivityPageProps = {
  searchParams?: {
    status?: string;
  };
};

export default async function DashboardActivityPage({
  searchParams,
}: DashboardActivityPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const statusFilter =
    searchParams?.status === "QUEUED" ||
    searchParams?.status === "RUNNING" ||
    searchParams?.status === "SUCCEEDED" ||
    searchParams?.status === "FAILED" ||
    searchParams?.status === "CANCELED"
      ? searchParams.status
      : undefined;
  const executionHistory = await fetchExecutionHistory({
    organizationId: user.organizationId!,
    status: statusFilter,
    page: 1,
    pageSize: 12,
  });

  const latestExecution = executionHistory.items[0];
  const timeline = latestExecution
    ? await fetchExecutionTimeline({
        organizationId: user.organizationId!,
        executionId: latestExecution.id,
        page: 1,
        pageSize: 50,
      })
    : {
        items: [] as Array<{
          id: string;
          level: "DEBUG" | "INFO" | "WARN" | "ERROR";
          message: string;
          metadata?: Record<string, unknown> | null;
          occurredAt: Date;
        }>,
      };

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Execution Activity"
        title="Real-Time Activity Timeline"
        description="Track execution lifecycle events and inspect logs emitted by autonomous web workflows."
      />

      <StatusFilter
        options={[
          { label: "All", value: "ALL" },
          { label: "Queued", value: "QUEUED" },
          { label: "Running", value: "RUNNING" },
          { label: "Succeeded", value: "SUCCEEDED" },
          { label: "Failed", value: "FAILED" },
          { label: "Canceled", value: "CANCELED" },
        ]}
      />

      <ActivityLivePanel
        initialExecutions={executionHistory.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
        initialLogs={timeline.items.map((item) => ({
          ...item,
          occurredAt: item.occurredAt.toISOString(),
        }))}
        statusFilter={statusFilter}
      />
    </div>
  );
}
