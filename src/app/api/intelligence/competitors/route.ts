import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { createCompetitor, listCompetitors } from "@/lib/competitor/competitor.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().trim().url(),
});

export async function GET() {
  try {
    const user = await requireOrganizationRole("MEMBER");
    const items = await listCompetitors(user.organizationId!);
    return NextResponse.json({ items });
  } catch (error) {
    return structuredApiError(500, "COMPETITORS_FETCH_FAILED", "Failed to fetch competitors", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole("ADMIN");
    const payload = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_COMPETITOR_PAYLOAD", "Invalid competitor payload", {
        issues: parsed.error.flatten(),
      });
    }

    const competitor = await createCompetitor({
      orgId: user.organizationId!,
      name: parsed.data.name,
      website: parsed.data.website,
    });
    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    return structuredApiError(500, "COMPETITOR_CREATE_FAILED", "Failed to create competitor", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
