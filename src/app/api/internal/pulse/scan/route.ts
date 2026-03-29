import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import {
  appendExecutionEvent,
  queueExecution,
} from "@/server/services/executions/execution-service";
import { createWorkflowTemplate } from "@/server/services/workflows/workflow-service";
import { triggerWorkers } from "@/lib/worker/trigger";

const pulseScanSchema = z.object({
  domain: z.string().trim().min(1),
  agentId: z.string().trim().min(1),
});

const SCAN_TYPES = ["PRICING", "JOBS", "FEATURES"] as const;

type ScanType = (typeof SCAN_TYPES)[number];

function buildScanPrompt(scanType: ScanType, domain: string): string {
  switch (scanType) {
    case "PRICING":
      return `Visit ${domain}/pricing (try ${domain}/plans too). Extract all pricing tiers: name, monthly price, annual price, key features listed. Return as structured data.`;
    case "JOBS":
      return `Visit ${domain}/careers or ${domain}/jobs. List all open job postings from the last 60 days: title, department, location, date posted. Group by department. High hiring in Engineering = new product. High in Sales = market expansion.`;
    case "FEATURES":
      return `Visit ${domain}/features (try ${domain}/product, ${domain}/solutions). Extract the complete feature list organized by category. Note any features marked as 'new' or 'beta'.`;
  }
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, pulseScanSchema);
  if (error) {
    return error;
  }

  const pulseId = crypto.randomUUID();
  const { domain, agentId } = data;

  const scans = await Promise.all(
    SCAN_TYPES.map(async (scanType) => {
      const task = buildScanPrompt(scanType, domain);
      const targetUrl = domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;

      // Auto-create a workflow so the worker can process this execution
      const workflow = await createWorkflowTemplate({
        organizationId: user.organizationId!,
        agentId,
        createdById: user.id,
        name: `Pulse: ${scanType} — ${domain.slice(0, 40)}`,
        definition: {
          naturalLanguageTask: task,
          steps: [
            {
              id: crypto.randomUUID(),
              action: "Navigate and extract",
              target: targetUrl,
              expectedOutcome: `Competitive intel: ${scanType}`,
            },
          ],
          guardrails: [],
          timeoutSeconds: 120,
          retryLimit: 1,
        },
      });

      const execution = await queueExecution({
        organizationId: user.organizationId!,
        agentId,
        workflowId: workflow.id,
        requestedById: user.id,
        trigger: "MANUAL",
        inputPayload: {
          pulseId,
          scanType,
          targetUrl,
          taskOverride: task,
        },
      });

      await appendExecutionEvent({
        organizationId: user.organizationId!,
        executionId: execution.id,
        level: "INFO",
        message: `Pulse scan queued (pulseId: ${pulseId}, scanType: ${scanType}, domain: ${domain})`,
      });

      return { executionId: execution.id, scanType };
    }),
  );

  // Trigger workers server-side so executions run even if user navigates away
  triggerWorkers(scans.map((s) => s.executionId));

  return NextResponse.json({ pulseId, scans }, { status: 201 });
}
