import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ReleaseControlPanel } from "@/components/dashboard/workflows/release-control-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchReleaseDashboard } from "@/server/services/workflows/release-manager-service";
import { fetchWorkflowCatalog } from "@/server/services/workflows/workflow-service";

export default async function DashboardReleasesPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("ADMIN");
  const [releases, workflows] = await Promise.all([
    fetchReleaseDashboard(user.organizationId!),
    fetchWorkflowCatalog({
      organizationId: user.organizationId!,
      page: 1,
      pageSize: 100,
    }),
  ]);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Progressive Delivery"
        title="Workflow Releases"
        description="Canary rollouts, traffic shifting, and automatic rollback controls."
      />
      <DashboardCard>
        <ReleaseControlPanel
          workflows={workflows.items.map((item) => ({
            id: item.id,
            name: item.name,
          }))}
          releases={releases.map((item) => ({
            id: item.id,
            status: item.status,
            canaryTrafficPercent: item.canaryTrafficPercent,
            failureThresholdPct: item.failureThresholdPct,
            minCanarySampleSize: item.minCanarySampleSize,
            autoRollbackEnabled: item.autoRollbackEnabled,
            stableWorkflow: {
              id: item.stableWorkflow.id,
              name: item.stableWorkflow.name,
            },
            canaryWorkflow: {
              id: item.canaryWorkflow.id,
              name: item.canaryWorkflow.name,
            },
            metricSnapshots: item.metricSnapshots.map((snapshot) => ({
              canaryFailurePct: snapshot.canaryFailurePct,
              canarySampleSize: snapshot.canarySampleSize,
              capturedAt: snapshot.capturedAt.toISOString(),
            })),
          }))}
        />
      </DashboardCard>
    </div>
  );
}
