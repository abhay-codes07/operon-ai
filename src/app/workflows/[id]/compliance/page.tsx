import { notFound } from "next/navigation";

import { ComplianceApprovalPanel } from "@/components/workflows/compliance-approval-panel";
import { ComplianceRiskBadge } from "@/components/workflows/compliance-risk-badge";
import { ComplianceViolationsTable } from "@/components/workflows/compliance-violations-table";
import { DownloadPassportButton } from "@/components/workflows/download-passport-button";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";
import { hasActiveWorkflowApproval, listWorkflowApprovals } from "@/lib/compliance/approval.service";
import { generatePlainEnglishSummary } from "@/lib/compliance/passport.service";

type WorkflowCompliancePageProps = {
  params: {
    id: string;
  };
};

export default async function WorkflowCompliancePage({
  params,
}: WorkflowCompliancePageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: params.id,
      organizationId: user.organizationId!,
    },
    select: {
      id: true,
      name: true,
    },
  });
  if (!workflow) {
    notFound();
  }

  const [approved, approvals, summary, violations] = await Promise.all([
    hasActiveWorkflowApproval(workflow.id),
    listWorkflowApprovals(workflow.id),
    generatePlainEnglishSummary(workflow.id),
    prisma.complianceViolation.findMany({
      where: {
        workflowId: workflow.id,
        organizationId: user.organizationId!,
      },
      orderBy: { detectedAt: "desc" },
      include: {
        run: {
          select: { id: true, status: true },
        },
      },
      take: 50,
    }),
  ]);

  const risk = summary?.riskLevel ?? "LOW";

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">AI Agent Compliance Passport</p>
        <h1 className="text-2xl font-semibold text-slate-900">{workflow.name}</h1>
        <p className="text-sm text-slate-600">Governance timeline, approval chain, and execution compliance posture.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Passport Risk Level</p>
            <ComplianceRiskBadge riskLevel={risk} />
          </div>
          <DownloadPassportButton workflowId={workflow.id} />
        </div>
        <p className="mt-3 text-sm text-slate-700">{summary?.summaryText ?? "No compliance summary generated yet."}</p>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
          <p>Domains: {summary?.domainsVisited.length ?? 0}</p>
          <p>Actions: {summary?.actionsPerformed.length ?? 0}</p>
          <p>Data Categories: {summary?.dataCategoriesAccessed.length ?? 0}</p>
        </div>
      </section>

      <ComplianceApprovalPanel
        workflowId={workflow.id}
        canApprove={user.role === "OWNER" || user.role === "ADMIN"}
        isApproved={approved}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Approval Chain</h2>
        {approvals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No approvals recorded for this workflow.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {approvals.map((approval) => (
              <article key={approval.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {approval.approvedBy.name ?? approval.approvedBy.email}
                </p>
                <p className="text-xs text-slate-600">
                  Version {approval.version} • Approved {new Date(approval.approvedAt).toLocaleString()}
                </p>
                {approval.revokedAt ? (
                  <p className="text-xs text-rose-700">Revoked at {new Date(approval.revokedAt).toLocaleString()}</p>
                ) : null}
                {approval.approvalNotes ? <p className="mt-1 text-xs text-slate-700">{approval.approvalNotes}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Compliance Violations</h2>
        <ComplianceViolationsTable items={violations} />
      </section>
    </div>
  );
}
