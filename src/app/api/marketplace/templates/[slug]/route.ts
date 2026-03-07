import { NextResponse } from "next/server";
import { z } from "zod";

import { getTemplateBySlug } from "@/lib/marketplace/marketplace.service";

import { marketplaceError } from "../../_lib/errors";

const paramsSchema = z.object({
  slug: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return marketplaceError(400, "INVALID_SLUG", "Invalid template slug");
  }

  const template = await getTemplateBySlug(parsed.data.slug);
  if (!template) {
    return marketplaceError(404, "TEMPLATE_NOT_FOUND", "Marketplace template not found");
  }

  return NextResponse.json({ template });
}
