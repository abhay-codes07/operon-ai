import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ShieldEventsTable } from "@/components/dashboard/shield/shield-events-table";
import { ShieldPolicyForm } from "@/components/dashboard/shield/shield-policy-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { listShieldEvents } from "@/lib/shield/event.service";
import { latestShieldPolicy } from "@/lib/shield/policy.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardShieldPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [events, policy] = await Promise.all([
    listShieldEvents({
      organizationId: user.organizationId!,
      limit: 100,
    }),
    latestShieldPolicy(user.organizationId!),
  ]);

  const severityTotals = events.reduce(
    (acc, event) => {
      acc[event.severity] += 1;
      return acc;
    },
    {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    },
  );

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operon Shield"
        title="Prompt Injection Defense"
        description="Trusted instruction boundaries, runtime policy enforcement, and attack telemetry."
      />

      <DashboardCard title="Threat Posture">
        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(severityTotals).map(([severity, count]) => (
            <article key={severity} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500">{severity}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{count}</p>
            </article>
          ))}
        </div>
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
