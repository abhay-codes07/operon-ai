import { calculateAverageCost } from "@/lib/finops/cost-aggregation.service";
import { prisma } from "@/server/db/client";

export async function calculateWorkflowROI(workflowId: string) {
  const [costSnapshot, impact] = await Promise.all([
    calculateAverageCost(workflowId),
    prisma.workflowBusinessImpact.findUnique({
      where: { workflowId },
      select: {
        estimatedDollarValuePerRun: true,
        category: true,
        teamOwner: true,
        businessObjective: true,
      },
    }),
  ]);

  const valuePerRun = impact ? Number(impact.estimatedDollarValuePerRun) : 0;
  const costPerRun = costSnapshot.avgCostPerRun;
  const roi = costPerRun > 0 ? valuePerRun / costPerRun : null;

  return {
    workflowId,
    valuePerRun,
    costPerRun,
    roi,
    impactCategory: impact?.category ?? null,
    teamOwner: impact?.teamOwner ?? null,
    businessObjective: impact?.businessObjective ?? null,
  };
}

export async function getOrganizationROI(orgId: string) {
  const workflows = await prisma.workflow.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true },
  });

  const items = [] as Array<{
    workflowId: string;
    workflowName: string;
    valuePerRun: number;
    costPerRun: number;
    roi: number | null;
  }>;

  for (const workflow of workflows) {
    const roi = await calculateWorkflowROI(workflow.id);
    items.push({
      workflowId: workflow.id,
      workflowName: workflow.name,
      valuePerRun: roi.valuePerRun,
      costPerRun: roi.costPerRun,
      roi: roi.roi,
    });
  }

  return items.sort((a, b) => (b.roi ?? -1) - (a.roi ?? -1));
}
