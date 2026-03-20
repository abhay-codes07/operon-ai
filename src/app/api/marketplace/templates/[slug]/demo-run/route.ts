import { randomUUID } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getTemplateBySlug } from "@/lib/marketplace/marketplace.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";
import { executeTinyFishWorkflow } from "@/server/integrations/tinyfish/client";

import { marketplaceError } from "../../../_lib/errors";

const paramsSchema = z.object({
  slug: z.string().trim().min(1),
});

const demoRunSchema = z.object({
  goal: z.string().trim().min(5).optional(),
  url: z.string().trim().url().optional(),
});

const workflowDefinitionSchema = z.object({
  naturalLanguageTask: z.string().trim().min(3),
  steps: z.array(
    z.object({
      id: z.string().trim().min(1),
      action: z.string().trim().min(1),
      target: z.string().trim().min(1),
      expectedOutcome: z.string().trim().min(1),
    }),
  ),
  guardrails: z.array(z.string()).default([]),
  timeoutSeconds: z.number().int().min(1).max(600).default(120),
  retryLimit: z.number().int().min(0).max(10).default(2),
});

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return marketplaceError(400, "INVALID_SLUG", "Invalid template slug");
  }

  const payload = await request.json().catch(() => ({}));
  const parsedBody = demoRunSchema.safeParse(payload);
  if (!parsedBody.success) {
    return marketplaceError(400, "INVALID_PAYLOAD", "Invalid demo-run payload", {
      issues: parsedBody.error.flatten(),
    });
  }

  const template = await getTemplateBySlug(parsedParams.data.slug);
  if (!template) {
    return marketplaceError(404, "TEMPLATE_NOT_FOUND", "Marketplace template not found");
  }

  const latestVersion = template.versions.find((item) => item.isLatest) ?? template.versions[0];
  if (!latestVersion) {
    return marketplaceError(400, "NO_TEMPLATE_VERSION", "Template has no published version");
  }

  const parsedDefinition = workflowDefinitionSchema.safeParse(latestVersion.workflowDefinition);
  if (!parsedDefinition.success) {
    return marketplaceError(500, "INVALID_TEMPLATE_DEFINITION", "Template workflow definition is invalid");
  }

  const agent = await prisma.agent.findFirst({
    where: { organizationId: user.organizationId! },
    select: { id: true },
  });
  if (!agent) {
    return marketplaceError(400, "NO_AGENT_AVAILABLE", "Create an agent before running live demos");
  }

  const requestId = randomUUID();
  const definition = parsedDefinition.data;
  const goal = parsedBody.data.goal ?? definition.naturalLanguageTask;
  const url = parsedBody.data.url ?? "";
  const injectedSteps = parsedBody.data.url
    ? [
        {
          id: "operonhub-open-url",
          action: "navigate",
          target: parsedBody.data.url,
          expectedOutcome: "Reach target page",
        },
        ...definition.steps,
      ]
    : definition.steps;

  const tinyfishResponse = await executeTinyFishWorkflow({
    requestId,
    organizationId: user.organizationId!,
    agentId: agent.id,
    workflowId: `operonhub:${template.slug}:${latestVersion.version}`,
    workflowName: template.title,
    naturalLanguageTask: goal,
    url,
    goal,
    steps: injectedSteps,
    guardrails: definition.guardrails,
    timeoutSeconds: definition.timeoutSeconds,
    retryLimit: definition.retryLimit,
    metadata: {
      source: "operonhub-demo",
      templateSlug: template.slug,
      templateVersion: latestVersion.version,
    },
  }).catch((error) =>
    marketplaceError(502, "TINYFISH_REQUEST_FAILED", "TinyFish execution request failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    }),
  );

  if (tinyfishResponse instanceof NextResponse) {
    return tinyfishResponse;
  }

  return NextResponse.json({
    runId: requestId,
    providerExecutionId: tinyfishResponse.providerExecutionId,
    status: tinyfishResponse.status,
    summary: tinyfishResponse.summary ?? null,
    output: tinyfishResponse.output ?? null,
    events: tinyfishResponse.events,
  });
}
