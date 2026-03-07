import { prisma } from "@/server/db/client";

export type ComplianceDashboardSummary = {
  totalWorkflows: number;
  approvedWorkflows: number;
  violations: number;
  passportsGenerated: number;
};

export async function getComplianceDashboardSummary(
  organizationId: string,
): Promise<ComplianceDashboardSummary> {
  const [totalWorkflows, approvedWorkflows, violations, passportsGenerated] =
    await Promise.all([
      prisma.workflow.count({
        where: { organizationId },
      }),
      prisma.workflowComplianceApproval.count({
        where: {
          organizationId,
          revokedAt: null,
        },
      }),
      prisma.complianceViolation.count({
        where: { organizationId },
      }),
      prisma.compliancePassport.count({
        where: {
          workflow: {
            organizationId,
          },
        },
      }),
    ]);

  return {
    totalWorkflows,
    approvedWorkflows,
    violations,
    passportsGenerated,
  };
}
