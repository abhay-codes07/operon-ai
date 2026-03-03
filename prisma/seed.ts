import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buildWorkflowDefinition(targetUrl: string) {
  return {
    targetUrl,
    steps: [
      {
        id: "navigate-home",
        action: "navigate",
        selector: null,
        value: targetUrl,
      },
      {
        id: "capture-snapshot",
        action: "screenshot",
        selector: "body",
        value: null,
      },
    ],
  };
}

async function main() {
  const seedEmail = process.env.SEED_OWNER_EMAIL ?? "owner@webops.ai";
  const seedPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";
  const seedOrgName = process.env.SEED_ORGANIZATION_NAME ?? "WebOps Demo Org";
  const seedOrgSlug = process.env.SEED_ORGANIZATION_SLUG ?? "webops-demo-org";

  const passwordHash = await hash(seedPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: seedEmail.toLowerCase() },
    update: {
      name: "WebOps Owner",
      passwordHash,
    },
    create: {
      email: seedEmail.toLowerCase(),
      name: "WebOps Owner",
      passwordHash,
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: seedOrgSlug },
    update: { name: seedOrgName },
    create: {
      name: seedOrgName,
      slug: seedOrgSlug,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  const crawlerAgent = await prisma.agent.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "Growth Site Crawler",
      },
    },
    update: {
      status: "ACTIVE",
      description: "Tracks competitor website updates and release notes.",
    },
    create: {
      organizationId: organization.id,
      createdById: user.id,
      name: "Growth Site Crawler",
      description: "Tracks competitor website updates and release notes.",
      status: "ACTIVE",
      metadata: {
        team: "Growth",
      },
    },
  });

  const qaAgent = await prisma.agent.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "Checkout QA Monitor",
      },
    },
    update: {
      status: "ACTIVE",
      description: "Validates checkout funnel steps and captures visual evidence.",
    },
    create: {
      organizationId: organization.id,
      createdById: user.id,
      name: "Checkout QA Monitor",
      description: "Validates checkout funnel steps and captures visual evidence.",
      status: "ACTIVE",
      metadata: {
        team: "Engineering",
      },
    },
  });

  const growthWorkflow = await prisma.workflow.upsert({
    where: {
      organizationId_agentId_name: {
        organizationId: organization.id,
        agentId: crawlerAgent.id,
        name: "Competitor Weekly Crawl",
      },
    },
    update: {
      status: "ACTIVE",
      scheduleCron: "0 8 * * 1",
      definition: buildWorkflowDefinition("https://example.com"),
    },
    create: {
      organizationId: organization.id,
      agentId: crawlerAgent.id,
      createdById: user.id,
      name: "Competitor Weekly Crawl",
      description: "Scans key competitor pages and logs notable changes.",
      status: "ACTIVE",
      scheduleCron: "0 8 * * 1",
      definition: buildWorkflowDefinition("https://example.com"),
    },
  });

  const qaWorkflow = await prisma.workflow.upsert({
    where: {
      organizationId_agentId_name: {
        organizationId: organization.id,
        agentId: qaAgent.id,
        name: "Checkout Regression Sweep",
      },
    },
    update: {
      status: "ACTIVE",
      scheduleCron: "0 */6 * * *",
      definition: buildWorkflowDefinition("https://example.com/pricing"),
    },
    create: {
      organizationId: organization.id,
      agentId: qaAgent.id,
      createdById: user.id,
      name: "Checkout Regression Sweep",
      description: "Runs end-to-end checkout checks every 6 hours.",
      status: "ACTIVE",
      scheduleCron: "0 */6 * * *",
      definition: buildWorkflowDefinition("https://example.com/pricing"),
    },
  });

  const [successfulExecution, failedExecution] = await Promise.all([
    prisma.execution.upsert({
      where: { id: "seed_execution_success" },
      update: {
        status: "SUCCEEDED",
        outputPayload: {
          summary: "No major content drift detected.",
          screenshots: 2,
        },
      },
      create: {
        id: "seed_execution_success",
        organizationId: organization.id,
        agentId: crawlerAgent.id,
        workflowId: growthWorkflow.id,
        requestedById: user.id,
        status: "SUCCEEDED",
        trigger: "SCHEDULED",
        inputPayload: {
          source: "seed",
        },
        outputPayload: {
          summary: "No major content drift detected.",
          screenshots: 2,
        },
        startedAt: new Date(Date.now() - 30 * 60_000),
        finishedAt: new Date(Date.now() - 27 * 60_000),
      },
    }),
    prisma.execution.upsert({
      where: { id: "seed_execution_failed" },
      update: {
        status: "FAILED",
        errorMessage: "Checkout submit button not found on step 3.",
      },
      create: {
        id: "seed_execution_failed",
        organizationId: organization.id,
        agentId: qaAgent.id,
        workflowId: qaWorkflow.id,
        requestedById: user.id,
        status: "FAILED",
        trigger: "SCHEDULED",
        inputPayload: {
          source: "seed",
        },
        errorMessage: "Checkout submit button not found on step 3.",
        startedAt: new Date(Date.now() - 20 * 60_000),
        finishedAt: new Date(Date.now() - 18 * 60_000),
      },
    }),
  ]);

  await prisma.executionLog.deleteMany({
    where: {
      executionId: { in: [successfulExecution.id, failedExecution.id] },
    },
  });

  await prisma.executionLog.createMany({
    data: [
      {
        executionId: successfulExecution.id,
        organizationId: organization.id,
        level: "INFO",
        message: "Execution started",
      },
      {
        executionId: successfulExecution.id,
        organizationId: organization.id,
        level: "INFO",
        message: "Captured homepage screenshot",
        metadata: {
          screenshotPath: "/storage/screenshots/sample-1.png",
        },
      },
      {
        executionId: successfulExecution.id,
        organizationId: organization.id,
        level: "INFO",
        message: "Execution completed successfully",
      },
      {
        executionId: failedExecution.id,
        organizationId: organization.id,
        level: "INFO",
        message: "Execution started",
      },
      {
        executionId: failedExecution.id,
        organizationId: organization.id,
        level: "ERROR",
        message: "Checkout submit button not found on step 3.",
        metadata: {
          selector: "#checkout-submit",
        },
      },
    ],
  });

  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

  await prisma.subscription.upsert({
    where: {
      stripeCustomerId: `seed-customer-${organization.id}`,
    },
    update: {
      organizationId: organization.id,
      plan: "STARTER",
      status: "ACTIVE",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    create: {
      organizationId: organization.id,
      stripeCustomerId: `seed-customer-${organization.id}`,
      plan: "STARTER",
      status: "ACTIVE",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  await prisma.usageRecord.upsert({
    where: {
      organizationId_metric_periodStart_periodEnd: {
        organizationId: organization.id,
        metric: "EXECUTIONS",
        periodStart,
        periodEnd,
      },
    },
    update: {
      quantity: 14,
    },
    create: {
      organizationId: organization.id,
      metric: "EXECUTIONS",
      periodStart,
      periodEnd,
      quantity: 14,
    },
  });

  console.log(`Seed complete: ${seedEmail} in organization ${seedOrgName}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
