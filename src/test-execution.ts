import { loadProcessEnvFromFiles } from "@/config/load-env";
import { prisma } from "@/server/db/client";
import { enqueueExecutionJob } from "@/server/queue/producers/execution-producer";

async function main() {
  loadProcessEnvFromFiles();

  // Get the first workflow
  const workflow = await prisma.workflow.findFirst({
    where: {
      status: "DRAFT",
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });

  if (!workflow) {
    console.log("No DRAFT workflow found");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found workflow: ${workflow.name} (${workflow.id})`);

  // Get an agent
  const agent = await prisma.agent.findFirst({
    where: {
      organizationId: workflow.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!agent) {
    console.log("No agent found");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found agent: ${agent.name} (${agent.id})`);

  // Create execution
  const execution = await prisma.execution.create({
    data: {
      organizationId: workflow.organizationId,
      agentId: agent.id,
      workflowId: workflow.id,
      status: "QUEUED",
      trigger: "MANUAL",
    },
    select: {
      id: true,
      status: true,
    },
  });

  console.log(`\nCreated execution: ${execution.id}`);

  // Queue the job using proper producer
  await enqueueExecutionJob({
    organizationId: workflow.organizationId,
    executionId: execution.id,
    agentId: agent.id,
    workflowId: workflow.id,
    trigger: "MANUAL",
    traceId: `trace-${execution.id}`,
  });

  console.log("Job queued!");
  console.log("Waiting 5 seconds for execution...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Check execution status
  const result = await prisma.execution.findUnique({
    where: { id: execution.id },
    select: {
      id: true,
      status: true,
      errorMessage: true,
    },
  });

  console.log(`\nExecution result:`, JSON.stringify(result, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
