import Link from "next/link";

import { ComplianceDashboardLive } from "@/components/dashboard/compliance/compliance-dashboard-live";
import { ComplianceRiskBadge } from "@/components/workflows/compliance-risk-badge";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";
import { getComplianceDashboardSummary } from "@/lib/compliance/dashboard.service";

export default async function DashboardCompliancePage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const [summary, workflows, violations, passports] = await Promise.all([
    getComplianceDashboardSummary(user.organizationId!),
    prisma.workflow.findMany({
      where: { organizationId: user.organizationId! },
      select: {
        id: true,
        name: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.complianceViolation.findMany({
      where: { organizationId: user.organizationId! },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { detectedAt: "desc" },
      take: 20,
    }),
    prisma.compliancePassport.findMany({
      where: { workflow: { organizationId: user.organizationId! } },
      select: {
        id: true,
        workflowId: true,
        riskLevel: true,
        lastGeneratedAt: true,
      },
      orderBy: { lastGeneratedAt: "desc" },
      take: 200,
    }),
  ]);

  type PassportRow = {
    workflowId: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    lastGeneratedAt: Date | null;
  };
  const passportMap = new Map<string, PassportRow>(
    passports.map((passport) => [
      passport.workflowId,
      {
        workflowId: passport.workflowId,
        riskLevel: passport.riskLevel,
        lastGeneratedAt: passport.lastGeneratedAt,
      },
    ]),
  );
  const approvalRows = await prisma.workflowComplianceApproval.findMany({
    where: {
      organizationId: user.organizationId!,
      revokedAt: null,
    },
    select: {
      workflowId: true,
    },
  });
  const approvedSet = new Set(approvalRows.map((item) => item.workflowId));

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">AI Agent Compliance Dashboard</h1>
        <p className="text-blue-100 text-lg">Compliance</p>
        <p className="text-blue-200 text-sm mt-2">Approval coverage, risk distribution, and recent compliance violations.</p>
      </div>

      {/* Live Summary */}
      <ComplianceDashboardLive initial={summary} />

      {/* Main Content Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compliance Status Table */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8 lg:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-6">Workflow Compliance Status</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Workflow</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Approval</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Passport Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {workflows.map((workflow) => {
                  const passport = passportMap.get(workflow.id);
                  const isApproved = approvedSet.has(workflow.id);
                  return (
                    <tr key={workflow.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/workflows/${workflow.id}/compliance`} className="text-white font-semibold hover:text-cyan-400 transition-colors">
                          {workflow.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isApproved 
                            ? "bg-green-900/30 text-green-300 border border-green-700/50" 
                            : "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50"
                        }`}>
                          {isApproved ? "✓ Approved" : "⏳ Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {passport ? (
                          <ComplianceRiskBadge riskLevel={passport.riskLevel} />
                        ) : (
                          <span className="text-xs text-slate-500">Unscored</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {passport?.lastGeneratedAt ? new Date(passport.lastGeneratedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Violations */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8 lg:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Compliance Violations</h2>
          {violations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">✓ No recent violations detected. Your workflows are compliant!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((violation) => (
                <div key={violation.id} className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 hover:border-red-500/50 transition-colors">
                  <p className="text-white font-semibold">{violation.violationType}</p>
                  <p className="text-slate-300 text-sm mt-1">{violation.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span>📋 {violation.workflow.name}</span>
                    <span>⏰ {new Date(violation.detectedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
