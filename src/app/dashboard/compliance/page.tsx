import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ComplianceRiskBadge } from "@/components/workflows/compliance-risk-badge";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export default async function DashboardCompliancePage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const [workflows, violations, passports] = await Promise.all([
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
      where: {
        workflow: {
          organizationId: user.organizationId!,
        },
      },
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

  const passportMap = new Map(passports.map((passport) => [passport.workflowId, passport]));
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
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Compliance"
        title="AI Agent Compliance Dashboard"
        description="Approval coverage, risk distribution, and recent compliance violations."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard>
          <p className="text-xs text-slate-500">Workflows</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{workflows.length}</p>
        </DashboardCard>
        <DashboardCard>
          <p className="text-xs text-slate-500">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{approvedSet.size}</p>
        </DashboardCard>
        <DashboardCard>
          <p className="text-xs text-slate-500">Recent Violations</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{violations.length}</p>
        </DashboardCard>
        <DashboardCard>
          <p className="text-xs text-slate-500">Passports Generated</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{passports.length}</p>
        </DashboardCard>
      </div>

      <DashboardCard title="Workflow Compliance Status">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Approval</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Passport</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workflows.map((workflow) => {
                const passport = passportMap.get(workflow.id);
                return (
                  <tr key={workflow.id}>
                    <td className="px-3 py-2 text-sm font-medium text-slate-900">
                      <Link href={`/workflows/${workflow.id}/compliance`} className="hover:underline">
                        {workflow.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">{approvedSet.has(workflow.id) ? "Approved" : "Pending"}</td>
                    <td className="px-3 py-2">
                      {passport ? <ComplianceRiskBadge riskLevel={passport.riskLevel} /> : <span className="text-xs text-slate-500">Unscored</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {passport?.lastGeneratedAt ? new Date(passport.lastGeneratedAt).toLocaleString() : "Not generated"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <DashboardCard title="Recent Compliance Violations">
        {violations.length === 0 ? (
          <p className="text-sm text-slate-600">No recent violations.</p>
        ) : (
          <div className="space-y-2">
            {violations.map((violation) => (
              <article key={violation.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{violation.violationType}</p>
                <p className="text-xs text-slate-700">{violation.description}</p>
                <p className="text-xs text-slate-500">
                  {violation.workflow.name} • {new Date(violation.detectedAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
