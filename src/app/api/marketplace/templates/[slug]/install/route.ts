import { NextResponse } from "next/server";
import { z } from "zod";

import { getTemplateBySlug, installTemplate } from "@/lib/marketplace/marketplace.service";
import { recomputeTemplateReliabilityScore } from "@/lib/marketplace/reliability.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

import { marketplaceError } from "../../../_lib/errors";

const paramsSchema = z.object({
  slug: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return marketplaceError(400, "INVALID_SLUG", "Invalid template slug");
  }

  const template = await getTemplateBySlug(parsed.data.slug);
  if (!template) {
    return marketplaceError(404, "TEMPLATE_NOT_FOUND", "Marketplace template not found");
  }

  const installation = await installTemplate(template.id, user.organizationId!);
  if (!installation) {
    return marketplaceError(400, "NO_TEMPLATE_VERSION", "Template has no latest publishable version");
  }

  await recomputeTemplateReliabilityScore(template.id);
  return NextResponse.json({ installation }, { status: 201 });
}
