import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import {
  appendExecutionEvent,
  queueExecution,
} from "@/server/services/executions/execution-service";

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
      const execution = await queueExecution({
        organizationId: user.organizationId!,
        agentId,
        requestedById: user.id,
        trigger: "MANUAL",
        inputPayload: {
          pulseId,
          scanType,
          targetUrl: domain,
          taskOverride: buildScanPrompt(scanType, domain),
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

  return NextResponse.json({ pulseId, scans }, { status: 201 });
}
