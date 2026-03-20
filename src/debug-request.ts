import { loadProcessEnvFromFiles } from "@/config/load-env";
import { prisma } from "@/server/db/client";
import { buildTinyFishExecutionRequest } from "@/server/integrations/tinyfish/request-builder";

async function main() {
  loadProcessEnvFromFiles();

  const workflow = await prisma.workflow.findFirst({
    where: { status: "DRAFT" },
    select: {
      id: true,
      name: true,
      organizationId: true,
      agentId: true,
      definition: true
    }
  });

  if (workflow) {
    console.log("Workflow definition:", JSON.stringify(workflow.definition, null, 2));
    
    const request = buildTinyFishExecutionRequest({
      requestId: "test-req",
      organizationId: workflow.organizationId,
      agentId: workflow.agentId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      definition: workflow.definition as any
    });
    
    console.log("\n\nBuilt request:", JSON.stringify(request, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
