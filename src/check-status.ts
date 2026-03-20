import { loadProcessEnvFromFiles } from "@/config/load-env";
import { prisma } from "@/server/db/client";

async function main() {
  loadProcessEnvFromFiles();

  // Get the most recent execution
  const execution = await prisma.execution.findFirst({
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
    console.log("📊 Most Recent Execution:");
    console.log(JSON.stringify(execution, null, 2));

    // Get logs
    const logs = await prisma.executionLog.findMany({
      where: {
        executionId: execution.id,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 5,
      select: {
        message: true,
        level: true,
      },
    });

    console.log("\n📋 Recent Logs:");
    logs.reverse().forEach((log) => {
      const icon = log.level === "ERROR" ? "❌" : log.level === "WARN" ? "⚠️" : "ℹ️";
      console.log(`${icon} [${log.level}] ${log.message}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
