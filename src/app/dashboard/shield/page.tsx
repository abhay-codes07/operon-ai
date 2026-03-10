import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ShieldEventsTable } from "@/components/dashboard/shield/shield-events-table";
import { ShieldLiveSummary } from "@/components/dashboard/shield/shield-live-summary";
import { ShieldPolicyForm } from "@/components/dashboard/shield/shield-policy-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { listShieldEvents } from "@/lib/shield/event.service";
import { latestShieldPolicy } from "@/lib/shield/policy.service";
import { getShieldSummary } from "@/lib/shield/summary.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardShieldPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [events, policy, summary] = await Promise.all([
    listShieldEvents({
      organizationId: user.organizationId!,
      limit: 100,
    }),
    latestShieldPolicy(user.organizationId!),
    getShieldSummary(user.organizationId!),
  ]);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operon Shield"
        title="Prompt Injection Defense"
        description="Trusted instruction boundaries, runtime policy enforcement, and attack telemetry."
      />

      <DashboardCard title="Threat Posture">
        <ShieldLiveSummary
          initial={{
            totalEvents: summary.totalEvents,
            severity: summary.severity,
            hotWorkflows: summary.hotWorkflows,
          }}
        />
      </DashboardCard>

      <DashboardCard title="Shield Policy" description="Allowlist and action controls enforced before sensitive steps.">
        <ShieldPolicyForm
          initialAllowedDomains={Array.isArray(policy?.allowedDomains) ? (policy.allowedDomains as string[]) : []}
          initialBlockedActions={Array.isArray(policy?.blockedActions) ? (policy.blockedActions as string[]) : []}
        />
      </DashboardCard>

      <DashboardCard title="Attack Timeline" description="Prompt injection attempts detected across active workflow runs.">
        <ShieldEventsTable
          items={events.map((event) => ({
            id: event.id,
            url: event.url,
            domLocation: event.domLocation,
            severity: event.severity,
            riskScore: event.riskScore,
            detectedAt: event.detectedAt.toISOString(),
            workflow: {
              id: event.workflow.id,
              name: event.workflow.name,
            },
            run: {
              id: event.run.id,
              status: event.run.status,
            },
          }))}
        />
      </DashboardCard>
    </div>
  );
}
