import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import { prisma } from "@/server/db/client";
import { queueExecution } from "@/server/services/executions/execution-service";

const ethicswatchSchema = z.object({
  organizationName: z.string().min(1),
  organizationUrl: z.string().url(),
  watchCategories: z
    .array(
      z.enum([
        "ESG",
        "GOVERNANCE",
        "ENVIRONMENT",
        "SOCIAL",
        "REGULATIONS",
        "SUPPLY_CHAIN",
      ]),
    )
    .min(1),
  agentId: z.string().min(1),
});

const mockMonitors = [
  {
    id: "ew-1",
    organizationName: "Apple Inc.",
    organizationUrl: "apple.com/environment",
    categories: ["ESG", "ENVIRONMENT", "SUPPLY_CHAIN"],
    status: "CHANGE_DETECTED",
    severity: "HIGH",
    lastChange: {
      detectedAt: "2 hours ago",
      title: "Apple updated 2030 Carbon Neutrality commitment scope",
      summary:
        "Apple expanded their supply chain carbon neutrality target from Tier 1 to Tier 3 suppliers, affecting ~200 additional manufacturing partners. New disclosure requirements added for conflict minerals sourcing.",
      implication:
        "Significant tightening of supplier ESG requirements. Companies in Apple's supply chain may face new compliance costs.",
      source:
        "apple.com/environment/pdf/Apple_Environmental_Progress_Report_2026.pdf",
      changeType: "POLICY_EXPANSION",
    },
    monitoringSince: "6 months ago",
    changesDetected: 4,
    lastScanned: "2 hours ago",
  },
  {
    id: "ew-2",
    organizationName: "SEC (U.S. Securities and Exchange Commission)",
    organizationUrl: "sec.gov/climate-disclosure",
    categories: ["REGULATIONS", "ESG", "GOVERNANCE"],
    status: "CHANGE_DETECTED",
    severity: "CRITICAL",
    lastChange: {
      detectedAt: "6 hours ago",
      title: "SEC finalized enhanced climate disclosure rules — effective Q2 2026",
      summary:
        "The SEC published final amendments to climate-related disclosure requirements. All large accelerated filers must now report Scope 1 and Scope 2 GHG emissions. New rules require disclosure of climate-related risks material to financial condition.",
      implication:
        "Every publicly traded company must update 10-K filings. Non-compliance carries material misstatement liability. Legal and compliance teams must begin gap analysis immediately.",
      source: "sec.gov/rules/final/2026/33-11275.pdf",
      changeType: "NEW_REGULATION",
    },
    monitoringSince: "1 year ago",
    changesDetected: 12,
    lastScanned: "6 hours ago",
  },
  {
    id: "ew-3",
    organizationName: "Microsoft Corporation",
    organizationUrl: "microsoft.com/en-us/corporate-responsibility",
    categories: ["ESG", "SOCIAL", "GOVERNANCE"],
    status: "MONITORING",
    severity: null,
    lastChange: null,
    monitoringSince: "3 months ago",
    changesDetected: 1,
    lastScanned: "30 minutes ago",
  },
];

export async function GET() {
  await requireOrganizationRole("MEMBER");
  return NextResponse.json({ monitors: mockMonitors });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, ethicswatchSchema);
  if (error) return error;

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: user.organizationId!,
      agentId: data.agentId,
      createdById: user.id,
      name: data.organizationName,
      status: "ACTIVE",
      definition: {
        type: "ethicswatch",
        organizationUrl: data.organizationUrl,
        watchCategories: data.watchCategories,
        status: "MONITORING",
      },
    },
  });

  await queueExecution({
    organizationId: user.organizationId!,
    agentId: data.agentId,
    workflowId: workflow.id,
    requestedById: user.id,
    trigger: "MANUAL",
    inputPayload: {
      ethicswatchMode: true,
      organizationUrl: data.organizationUrl,
      watchCategories: data.watchCategories,
    },
  });

  return NextResponse.json({ watchId: workflow.id }, { status: 201 });
}
