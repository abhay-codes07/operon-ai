import type { ComplianceActionType, ComplianceRiskLevel } from "@prisma/client";

import { prisma } from "@/server/db/client";

function computeRisk(actions: ComplianceActionType[]): ComplianceRiskLevel {
  if (actions.includes("WRITE") || actions.includes("SUBMIT")) {
    return "HIGH";
  }
  if (actions.includes("EXTRACT")) {
    return "MEDIUM";
  }
  return "LOW";
}

export async function generatePlainEnglishSummary(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, name: true },
  });
  if (!workflow) {
    return null;
  }

  const events = await prisma.complianceEvent.findMany({
    where: { workflowId },
    orderBy: { timestamp: "asc" },
  });

  const domains = [...new Set(events.map((event) => event.domainVisited).filter(Boolean))] as string[];
  const actions = events.map((event) => event.actionType);
  const dataCategories = [...new Set(events.map((event) => event.dataCategory).filter(Boolean))] as string[];
  const extractCount = events.filter((event) => event.actionType === "EXTRACT").length;
  const writeCount = events.filter((event) => event.actionType === "WRITE" || event.actionType === "SUBMIT").length;

  const referenceDate = new Date().toLocaleDateString();
  const summary = `On ${referenceDate} this workflow visited ${domains.length} domain(s), extracted ${extractCount} data action(s), and performed ${writeCount} write/submit action(s).`;
  const riskLevel = computeRisk(actions);

  const passport = await prisma.compliancePassport.upsert({
    where: { workflowId },
    create: {
      workflowId,
      lastGeneratedAt: new Date(),
      riskLevel,
      summaryText: summary,
      reportUrl: `/api/compliance/passport/${workflowId}/pdf`,
    },
    update: {
      lastGeneratedAt: new Date(),
      riskLevel,
      summaryText: summary,
      reportUrl: `/api/compliance/passport/${workflowId}/pdf`,
    },
  });

  return {
    workflowId,
    summaryText: summary,
    riskLevel,
    domainsVisited: domains,
    actionsPerformed: actions,
    dataCategoriesAccessed: dataCategories,
    passport,
  };
}

export async function getCompliancePassport(workflowId: string) {
  return prisma.compliancePassport.findUnique({
    where: { workflowId },
  });
}
