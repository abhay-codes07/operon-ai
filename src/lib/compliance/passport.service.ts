import { prisma } from "@/server/db/client";
import { computeComplianceRisk } from "@/lib/compliance/risk";

function buildSummaryText(input: {
  domainsVisitedCount: number;
  extractCount: number;
  writeCount: number;
  eventCount: number;
}): string {
  const reportDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `On ${reportDate}, this workflow visited ${input.domainsVisitedCount} domain(s), recorded ${input.eventCount} tracked action(s), extracted data ${input.extractCount} time(s), and executed write/submit actions ${input.writeCount} time(s).`;
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

  const domains = Array.from(
    new Set(events.map((event) => event.domainVisited).filter((value): value is string => Boolean(value))),
  );
  const actions = events.map((event) => event.actionType);
  const dataCategories = Array.from(
    new Set(events.map((event) => event.dataCategory).filter((value): value is string => Boolean(value))),
  );
  const extractCount = events.filter((event) => event.actionType === "EXTRACT").length;
  const writeCount = events.filter((event) => event.actionType === "WRITE" || event.actionType === "SUBMIT").length;

  const summary = buildSummaryText({
    domainsVisitedCount: domains.length,
    extractCount,
    writeCount,
    eventCount: events.length,
  });
  const riskLevel = computeComplianceRisk(actions);

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
