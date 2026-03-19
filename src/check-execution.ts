import { loadProcessEnvFromFiles } from "@/config/load-env";
import { prisma } from "@/server/db/client";

async function main() {
  loadProcessEnvFromFiles();

  // Find the most recent failed execution
  const execution = await prisma.execution.findFirst({
    where: {
      status: "FAILED",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      finishedAt: true,
    },
  });

  if (execution) {
    console.log("Recent Failed Execution:");
    console.log(JSON.stringify(execution, null, 2));

    // Now get the logs
    const logs = await prisma.executionLog.findMany({
      where: {
        executionId: execution.id,
      },
      orderBy: {
        occurredAt: "asc",
      },
      select: {
        message: true,
        level: true,
        occurredAt: true,
      },
    });

    console.log("\nExecution Logs:");
    logs.forEach((log) => {
      console.log(`${log.occurredAt} [${log.level}] ${log.message}`);
    });
  } else {
    console.log("No failed execution found");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
