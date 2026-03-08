import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { deleteCompetitor } from "@/lib/competitor/competitor.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const paramsSchema = z.object({
  id: z.string().trim().min(1),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const params = paramsSchema.safeParse(context.params);
    if (!params.success) {
      return structuredApiError(400, "INVALID_COMPETITOR_ID", "Competitor identifier is invalid");
    }

    const result = await deleteCompetitor(user.organizationId!, params.data.id);
    if (result.count === 0) {
      return structuredApiError(404, "COMPETITOR_NOT_FOUND", "Competitor not found");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return structuredApiError(500, "COMPETITOR_DELETE_FAILED", "Failed to delete competitor", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
