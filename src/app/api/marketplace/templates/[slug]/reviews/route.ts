import { NextResponse } from "next/server";
import { z } from "zod";

import { addReview, getTemplateBySlug } from "@/lib/marketplace/marketplace.service";
import { recomputeTemplateReliabilityScore } from "@/lib/marketplace/reliability.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

import { marketplaceError } from "../../../_lib/errors";

const paramsSchema = z.object({
  slug: z.string().trim().min(1),
});

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
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

  const payload = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(payload);
  if (!parsedBody.success) {
    return marketplaceError(400, "INVALID_PAYLOAD", "Invalid review payload", {
      issues: parsedBody.error.flatten(),
    });
  }

  const template = await getTemplateBySlug(parsedParams.data.slug);
  if (!template) {
    return marketplaceError(404, "TEMPLATE_NOT_FOUND", "Marketplace template not found");
  }

  await addReview(template.id, user.organizationId!, parsedBody.data.rating, parsedBody.data.comment);
  await recomputeTemplateReliabilityScore(template.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
