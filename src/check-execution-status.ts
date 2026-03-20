import { loadProcessEnvFromFiles } from "@/config/load-env";
import { prisma } from "@/server/db/client";

async function main() {
  loadProcessEnvFromFiles();

  const execution = await prisma.execution.findUnique({
    where: { id: 'cmmyje7s80001emmsqp3l0wzb' },
    select: { 
      id: true, 
      status: true, 
      errorMessage: true,
      outputPayload: true,
      updatedAt: true
    }
  });

  console.log("Execution status:", JSON.stringify(execution, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
