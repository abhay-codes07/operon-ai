import { prisma } from "@/server/db/client";

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): Buffer {
  const content = lines
    .map((line, index) => `BT /F1 11 Tf 50 ${780 - index * 14} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];

  let offset = 0;
  const bodyParts = [] as string[];
  const xref = ["0000000000 65535 f "];
  for (const object of objects) {
    const serialized = `${object}\n`;
    bodyParts.push(serialized);
    xref.push(`${offset.toString().padStart(10, "0")} 00000 n `);
    offset += Buffer.byteLength(serialized, "utf8");
  }
  const header = "%PDF-1.4\n";
  const body = bodyParts.join("");
  const xrefOffset = Buffer.byteLength(header + body, "utf8");
  const trailer = `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(`${header}${body}${trailer}`, "utf8");
}

export async function generateCompliancePassportPdf(workflowId: string) {
  const [workflow, passport, approvals, violations, events, runs] = await Promise.all([
    prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, name: true, organizationId: true },
    }),
    prisma.compliancePassport.findUnique({
      where: { workflowId },
    }),
    prisma.workflowComplianceApproval.findMany({
      where: { workflowId },
      include: {
        approvedBy: { select: { name: true, email: true } },
      },
      orderBy: { approvedAt: "desc" },
      take: 20,
    }),
    prisma.complianceViolation.findMany({
      where: { workflowId },
      orderBy: { detectedAt: "desc" },
      take: 20,
    }),
    prisma.complianceEvent.findMany({
      where: { workflowId },
      orderBy: { timestamp: "desc" },
      take: 50,
    }),
    prisma.execution.findMany({
      where: { workflowId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, createdAt: true },
    }),
  ]);

  if (!workflow) {
    return null;
  }

  const domains = Array.from(
    new Set(events.map((event) => event.domainVisited).filter((value): value is string => Boolean(value))),
  );
  const lines = [
    "Operon AI Compliance Passport",
    `Workflow: ${workflow.name}`,
    `Generated: ${new Date().toISOString()}`,
    "----------------------------------------",
    `Risk Level: ${passport?.riskLevel ?? "UNCONFIGURED"}`,
    `Summary: ${passport?.summaryText ?? "No summary available"}`,
    "----------------------------------------",
    `Approvals: ${approvals.length}`,
    `Violations: ${violations.length}`,
    `Runs Logged: ${runs.length}`,
    `Domains Visited: ${domains.join(", ") || "None"}`,
    "----------------------------------------",
    "Recent Approval Chain",
    ...approvals.slice(0, 5).map((approval) => `- ${approval.approvedBy.name ?? approval.approvedBy.email} at ${approval.approvedAt.toISOString()}`),
    "----------------------------------------",
    "Recent Violations",
    ...violations.slice(0, 5).map((violation) => `- ${violation.violationType}: ${violation.description}`),
    "----------------------------------------",
    "Recent Runs",
    ...runs.slice(0, 5).map((run) => `- ${run.id.slice(0, 8)} | ${run.status} | ${run.createdAt.toISOString()}`),
  ];

  return buildSimplePdf(lines);
}
