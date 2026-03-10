import { prisma } from "@/server/db/client";

async function logViolationAudit(input: {
  organizationId: string;
  workflowId: string;
  agentId: string;
  violationType: string;
  description: string;
  runId?: string;
}) {
  const audit = await prisma.executionAudit.create({
    data: {
      organizationId: input.organizationId,
      executionId: input.runId,
      agentId: input.agentId,
      action: "COMPLIANCE_VIOLATION",
      intentHash: `${input.workflowId}:${input.violationType}:${Date.now()}`,
      policyDecision: "DENY",
      result: "FAILED",
      riskLevel: "HIGH",
      riskScore: 85,
      riskReason: input.description,
      metadata: {
        workflowId: input.workflowId,
        violationType: input.violationType,
      },
    },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      executionAuditId: audit.id,
      eventType: "COMPLIANCE_VIOLATION",
      message: input.description,
      metadata: {
        workflowId: input.workflowId,
        violationType: input.violationType,
      },
    },
  });
}

export async function createComplianceViolation(input: {
  workflowId: string;
  runId?: string;
  violationType: string;
  description: string;
}) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: input.workflowId },
    select: { id: true, organizationId: true, agentId: true },
  });
  if (!workflow) {
    return null;
  }

  const violation = await prisma.complianceViolation.create({
    data: {
      workflowId: workflow.id,
      runId: input.runId,
      violationType: input.violationType,
      description: input.description,
      organizationId: workflow.organizationId,
    },
  });

  await logViolationAudit({
    organizationId: workflow.organizationId,
    workflowId: workflow.id,
    agentId: workflow.agentId,
    violationType: input.violationType,
    description: input.description,
    runId: input.runId,
  });

  return violation;
}

export async function detectComplianceViolationsForRun(input: {
  runId: string;
  workflowId: string;
}) {
  const execution = await prisma.execution.findUnique({
    where: { id: input.runId },
    select: { organizationId: true },
  });
  if (!execution) {
    return [];
  }

  const [policy, events] = await Promise.all([
    prisma.organizationSecurityPolicy.findUnique({
      where: { organizationId: execution.organizationId },
      select: { domainAllowlist: true },
    }),
    prisma.complianceEvent.findMany({
      where: { runId: input.runId },
      orderBy: { timestamp: "desc" },
      take: 1000,
    }),
  ]);

  const allowlist = (policy?.domainAllowlist as string[] | undefined) ?? [];
  const violations = [] as Array<{ violationType: string; description: string }>;

  const visitedDomains = Array.from(
    new Set(events.map((event) => event.domainVisited).filter((value): value is string => Boolean(value))),
  ) as string[];
  for (const domain of visitedDomains) {
    if (allowlist.length > 0 && !allowlist.includes(domain.toLowerCase())) {
      violations.push({
        violationType: "DOMAIN_OUTSIDE_ALLOWLIST",
        description: `Visited domain ${domain} outside organization allowlist`,
      });
    }
  }

  const extractionCount = events.filter((event) => event.actionType === "EXTRACT").length;
  if (extractionCount > 200) {
    violations.push({
      violationType: "EXCESSIVE_DATA_EXTRACTION",
      description: `Detected ${extractionCount} extraction actions in a single run`,
    });
  }

  const created = [] as Awaited<ReturnType<typeof createComplianceViolation>>[];
  for (const violation of violations) {
    created.push(
      await createComplianceViolation({
        workflowId: input.workflowId,
        runId: input.runId,
        violationType: violation.violationType,
        description: violation.description,
      }),
    );
  }

  return created.filter(Boolean);
}

export async function listComplianceViolations(organizationId: string) {
  return prisma.complianceViolation.findMany({
    where: { organizationId },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
      run: {
        select: { id: true, status: true, createdAt: true },
      },
    },
    orderBy: { detectedAt: "desc" },
    take: 200,
  });
}
