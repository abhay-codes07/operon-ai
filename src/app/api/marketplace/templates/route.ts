import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import {
  createTemplate,
  listTemplates,
} from "@/lib/marketplace/marketplace.service";
import { recomputeTemplateReliabilityScore } from "@/lib/marketplace/reliability.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

import { marketplaceError } from "../_lib/errors";

const querySchema = z.object({
  query: z.string().trim().optional(),
  category: z.string().trim().optional(),
  pricingModel: z.enum(["FREE", "PAID"]).optional(),
  minReliabilityScore: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const createTemplateSchema = z.object({
  slug: z.string().trim().min(3),
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  category: z.string().trim().min(2),
  pricingModel: z.enum(["FREE", "PAID"]).default("FREE"),
  priceUsd: z.number().min(0).optional(),
  version: z.string().trim().min(1),
  workflowDefinition: z.record(z.string(), z.unknown()),
  changelog: z.string().trim().optional(),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) {
    return marketplaceError(400, "INVALID_QUERY", "Invalid template filter query", {
      issues: parsed.error.flatten(),
    });
  }

  const result = await listTemplates(parsed.data);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("ADMIN");
  const payload = await request.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return marketplaceError(400, "INVALID_PAYLOAD", "Invalid template payload", {
      issues: parsed.error.flatten(),
    });
  }

  let created: Awaited<ReturnType<typeof createTemplate>>;
  try {
    created = await createTemplate({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      authorOrgId: user.organizationId!,
      pricingModel: parsed.data.pricingModel,
      priceUsd: parsed.data.priceUsd,
      version: parsed.data.version,
      workflowDefinition: parsed.data.workflowDefinition,
      changelog: parsed.data.changelog,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return marketplaceError(409, "TEMPLATE_EXISTS", "Template slug already exists");
    }
    return marketplaceError(500, "TEMPLATE_CREATE_FAILED", "Failed to create marketplace template");
  }

  await recomputeTemplateReliabilityScore(created.template.id);
  return NextResponse.json(created, { status: 201 });
}
