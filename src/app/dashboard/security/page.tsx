import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SecurityPolicyForm } from "@/components/dashboard/security/security-policy-form";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchOrganizationPolicy } from "@/server/security/policy-engine";

export default async function DashboardSecurityPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("ADMIN");
  const policy = await fetchOrganizationPolicy(user.organizationId!);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operational Guardrails"
        title="Security Policy Engine"
        description="Define domain, action, and timing controls that govern autonomous workflow execution."
      />
      <DashboardCard title="Organization Policy" description="Policy checks are enforced before execution dispatch">
        <SecurityPolicyForm
          initialPolicy={{
            domainAllowlist: policy?.domainAllowlist ?? [],
            restrictedActions: policy?.restrictedActions ?? [],
            allowedWindowStartHr: policy?.allowedWindowStartHr,
            allowedWindowEndHr: policy?.allowedWindowEndHr,
            timezone: policy?.timezone ?? "UTC",
            requireHttps: policy?.requireHttps ?? true,
          }}
        />
      </DashboardCard>
    </div>
  );
}
