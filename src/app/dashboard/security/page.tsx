import { AgentPolicyManager } from "@/components/dashboard/security/agent-policy-manager";
import { AuditLogViewer } from "@/components/dashboard/security/audit-log-viewer";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SecurityPolicyForm } from "@/components/dashboard/security/security-policy-form";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { fetchAuditLogs } from "@/server/services/security/audit-log-service";
import { fetchAgentPolicies } from "@/server/services/security/agent-policy-service";
import { fetchOrganizationPolicy } from "@/server/security/policy-engine";

export default async function DashboardSecurityPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("ADMIN");
  const [policy, agents, auditLogs, agentPolicies] = await Promise.all([
    fetchOrganizationPolicy(user.organizationId!),
    fetchAgentCatalog({
      organizationId: user.organizationId!,
      page: 1,
      pageSize: 100,
    }),
    fetchAuditLogs({
      organizationId: user.organizationId!,
      limit: 40,
    }),
    fetchAgentPolicies(user.organizationId!),
  ]);

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
      <DashboardCard
        title="Secure Agent Gateway Policy"
        description="Configure per-agent policy-as-code constraints."
      >
        <AgentPolicyManager
          agents={agents.items.map((item) => ({
            id: item.id,
            name: item.name,
          }))}
          initialPolicies={agentPolicies.map((item) => ({
            id: item.id,
            agentId: item.agentId,
            enabled: item.enabled,
            maxRunsPerHour: item.maxRunsPerHour,
            updatedAt: item.updatedAt.toISOString(),
          }))}
        />
      </DashboardCard>
      <DashboardCard
        title="Execution Audit Ledger"
        description="Every intercepted action and policy decision from the secure gateway."
      >
        <AuditLogViewer
          initialItems={auditLogs.map((item) => ({
            id: item.id,
            agent: {
              id: item.agent.id,
              name: item.agent.name,
            },
            action: item.action,
            targetDomain: item.targetDomain,
            policyDecision: item.policyDecision,
            result: item.result,
            riskLevel: item.riskLevel,
            riskScore: item.riskScore,
            riskReason: item.riskReason,
            occurredAt: item.occurredAt.toISOString(),
            events: item.events.map((event) => ({
              id: event.id,
              eventType: event.eventType,
              message: event.message,
              occurredAt: event.occurredAt.toISOString(),
            })),
          }))}
        />
      </DashboardCard>
    </div>
  );
}
