import { NextResponse } from "next/server";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { getShieldSummary } from "@/lib/shield/summary.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const summary = await getShieldSummary(user.organizationId!);

    const workflowIds = summary.hotWorkflowIds.map((item) => item.workflowId);
    const workflows = workflowIds.length
      ? await prisma.workflow.findMany({
          where: {
            id: {
              in: workflowIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const workflowNameMap = new Map(workflows.map((item) => [item.id, item.name]));
    const hotWorkflows = summary.hotWorkflowIds.map((item) => ({
      workflowId: item.workflowId,
      workflowName: workflowNameMap.get(item.workflowId) ?? "Unknown workflow",
      count: item.count,
    }));

    return NextResponse.json({
      summary: {
        totalEvents: summary.totalEvents,
        severity: summary.severity,
        hotWorkflows,
      },
    });
  } catch (error) {
    return structuredApiError(500, "SHIELD_SUMMARY_FETCH_FAILED", "Failed to fetch shield summary", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
