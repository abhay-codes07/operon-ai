import { AgentPolicyManager } from "@/components/dashboard/security/agent-policy-manager";
import { AuditLogViewer } from "@/components/dashboard/security/audit-log-viewer";
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Security Policy Engine</h1>
        <p className="text-red-100 text-lg">Operational Guardrails</p>
        <p className="text-red-200 text-sm mt-2">Define domain, action, and timing controls that govern autonomous workflow execution.</p>
      </div>

      {/* Organization Policy */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Organization Policy</h2>
        <p className="text-slate-400 text-sm mb-6">Policy checks are enforced before execution dispatch</p>
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
      </div>

      {/* Agent Policies */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Secure Agent Gateway Policy</h2>
        <p className="text-slate-400 text-sm mb-6">Configure per-agent policy-as-code constraints.</p>
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
      </div>

      {/* Audit Ledger */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Execution Audit Ledger</h2>
        <p className="text-slate-400 text-sm mb-6">Every intercepted action and policy decision from the secure gateway.</p>
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
      </div>
    </div>
  );
}
