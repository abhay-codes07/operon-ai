import { NextResponse } from "next/server";

import { prisma } from "@/server/db/client";
import { runExecutionWithTinyFish } from "@/server/services/executions/tinyfish-execution-runner";
import { appendExecutionEvent, setExecutionStatus } from "@/server/services/executions/execution-service";

// Allow up to 5 minutes for long-running TinyFish executions (Vercel Pro)
export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify cron/worker secret in production
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Find the oldest QUEUED executions that have a workflowId
  const executions = await prisma.execution.findMany({
    where: {
      status: "QUEUED",
      workflowId: { not: null },
    },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
    },
  });

  if (executions.length === 0) {
    return NextResponse.json({ processed: 0, message: "No queued executions" });
  }

  const results = await Promise.allSettled(
    executions.map(async (exec) => {
      await appendExecutionEvent({
        organizationId: exec.organizationId,
        executionId: exec.id,
        level: "INFO",
        message: "Execution picked up by Vercel cron worker",
      });

      return runExecutionWithTinyFish({
        organizationId: exec.organizationId,
        executionId: exec.id,
        agentId: exec.agentId,
        workflowId: exec.workflowId!,
        traceId: crypto.randomUUID(),
      });
    }),
  );

  // Mark any that threw as FAILED
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result?.status === "rejected") {
      const exec = executions[i];
      if (exec) {
        await setExecutionStatus({
          organizationId: exec.organizationId,
          executionId: exec.id,
          status: "FAILED",
        }).catch(() => null);
        await appendExecutionEvent({
          organizationId: exec.organizationId,
          executionId: exec.id,
          level: "ERROR",
          message: `Worker failed: ${String(result.reason)}`,
        }).catch(() => null);
      }
    }
  }

  const processed = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ processed, failed, total: executions.length });
}
