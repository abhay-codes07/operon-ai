import { NextResponse } from "next/server";
import { z } from "zod";

import { validateJson } from "@/server/api/validation";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { detectIncident, fetchIncidentAlerts } from "@/server/services/mission-control/incident-detection-service";
import { executeRunbooksForIncident } from "@/server/services/mission-control/runbook-engine";

const createIncidentBodySchema = z.object({
  signalType: z.enum(["FAILURE_SPIKE", "SELECTOR_ERROR_LOOP", "RETRY_LOOP"]),
  title: z.string().trim().min(3),
  description: z.string().trim().min(5),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  agentId: z.string().trim().min(1).optional(),
  executionId: z.string().trim().min(1).optional(),
  triggerRunbooks: z.boolean().optional(),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const incidents = await fetchIncidentAlerts(user.organizationId!);

  return NextResponse.json({ incidents });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const body = await validateJson(request, createIncidentBodySchema);

  if (!body.success) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const incident = await detectIncident({
    organizationId: user.organizationId!,
    signalType: body.data.signalType,
    title: body.data.title,
    description: body.data.description,
    severity: body.data.severity,
    agentId: body.data.agentId,
    executionId: body.data.executionId,
  });

  const runbookExecutions = body.data.triggerRunbooks
    ? await executeRunbooksForIncident({
        organizationId: user.organizationId!,
        triggerType: body.data.signalType,
        incidentId: incident.id,
        executionId: body.data.executionId,
        agentId: body.data.agentId,
      })
    : [];

  return NextResponse.json({ incident, runbookExecutions }, { status: 201 });
}
