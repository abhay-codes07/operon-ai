import { loadProcessEnvFromFiles } from "@/config/load-env";
import { prisma } from "@/server/db/client";

async function main() {
  loadProcessEnvFromFiles();

  // Get the most recent succeeded execution
  const execution = await prisma.execution.findFirst({
    where: {
      status: "SUCCEEDED",
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
    console.log("✅ Recent Succeeded Execution:");
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

    console.log("\n📋 Execution Logs:");
    logs.forEach((log) => {
      const icon = log.level === "ERROR" ? "❌" : log.level === "WARN" ? "⚠️" : "ℹ️";
      console.log(`${icon} [${log.level}] ${log.message}`);
    });
  } else {
    console.log("No succeeded execution found");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
