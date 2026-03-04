import { ApprovalQueuePanel } from "@/components/dashboard/control-plane/approval-queue-panel";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchApprovalQueue } from "@/server/services/control-plane/approval-service";

export default async function DashboardControlPlanePage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("ADMIN");
  const approvals = await fetchApprovalQueue(user.organizationId!);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Control Plane"
        title="Approval Queue"
        description="Human-in-the-loop gates for sensitive runtime actions."
      />
      <DashboardCard title="Pending Approvals" description="Approve or reject blocked execution steps">
        <ApprovalQueuePanel
          items={approvals.map((item) => ({
            id: item.id,
            executionId: item.executionId,
            stepKey: item.stepKey,
            actionType: item.actionType,
            requestedAt: item.requestedAt.toISOString(),
          }))}
        />
      </DashboardCard>
    </div>
  );
}
