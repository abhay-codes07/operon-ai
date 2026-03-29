import { NextResponse } from "next/server";

import { getAuthSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { runExecutionWithTinyFish } from "@/server/services/executions/tinyfish-execution-runner";
import { appendExecutionEvent, setExecutionStatus } from "@/server/services/executions/execution-service";

// Vercel Pro plan supports up to 300s. TinyFish tasks can take 60-300s.
// Process ONE execution at a time within this window.
export const maxDuration = 300;

export async function GET(request: Request) {
  // Allow: valid CRON_SECRET bearer token, or authenticated user session
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isValidCronSecret = cronSecret && auth === `Bearer ${cronSecret}`;

  if (!isValidCronSecret) {
    // Fall back to checking for a valid user session (browser-triggered)
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Reconcile executions stuck in RUNNING for > 6 minutes (Vercel killed them before completion)
  const stuckCutoff = new Date(Date.now() - 6 * 60 * 1000);
  const stuckExecutions = await prisma.execution.findMany({
    where: { status: "RUNNING", updatedAt: { lt: stuckCutoff } },
    select: { id: true, organizationId: true },
    take: 10,
  });
  if (stuckExecutions.length > 0) {
    await Promise.all(
      stuckExecutions.map(async (ex) => {
        await prisma.execution.update({
          where: { id: ex.id },
          data: { status: "QUEUED" },
        });
        await appendExecutionEvent({
          organizationId: ex.organizationId,
          executionId: ex.id,
          level: "WARN",
          message: "Execution was stuck in RUNNING state — re-queued for retry",
        });
      }),
    );
  }

  const url = new URL(request.url);
  const targetExecutionId = url.searchParams.get("executionId");

  // Pick up a specific execution by ID, or the oldest QUEUED execution with a workflowId
  const execution = await prisma.execution.findFirst({
    where: targetExecutionId
      ? { id: targetExecutionId, status: "QUEUED", workflowId: { not: null } }
      : { status: "QUEUED", workflowId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      organizationId: true,
      agentId: true,
      workflowId: true,
      inputPayload: true,
    },
  });

  if (!execution) {
    return NextResponse.json({ processed: 0, message: "No queued executions" });
  }

  await appendExecutionEvent({
    organizationId: execution.organizationId,
    executionId: execution.id,
    level: "INFO",
    message: "Execution picked up by worker",
  });

  try {
    const inputPayload = execution.inputPayload as Record<string, unknown> | null;
    const targetUrlOverride = typeof inputPayload?.targetUrl === "string" ? inputPayload.targetUrl : undefined;

    await runExecutionWithTinyFish({
      organizationId: execution.organizationId,
      executionId: execution.id,
      agentId: execution.agentId,
      workflowId: execution.workflowId!,
      traceId: crypto.randomUUID(),
      targetUrlOverride,
    });

    return NextResponse.json({ processed: 1, failed: 0, executionId: execution.id });
  } catch (error) {
    await setExecutionStatus({
      organizationId: execution.organizationId,
      executionId: execution.id,
      status: "FAILED",
    }).catch(() => null);

    await appendExecutionEvent({
      organizationId: execution.organizationId,
      executionId: execution.id,
      level: "ERROR",
      message: `Worker failed: ${String(error)}`,
    }).catch(() => null);

    return NextResponse.json(
      { processed: 0, failed: 1, executionId: execution.id, error: String(error) },
      { status: 500 },
    );
  }
}
