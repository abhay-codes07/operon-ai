import { NextResponse } from "next/server";
import { z } from "zod";

import { structuredApiError } from "@/app/api/_lib/structured-error";
import { buildGhostActionPreview } from "@/lib/copilot/ghost-cursor.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

const payloadSchema = z.object({
  action: z.string().trim().min(1).max(120),
  target: z.string().trim().max(500).optional(),
  value: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    await requireOrganizationRole("MEMBER");
    const payload = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
      return structuredApiError(400, "INVALID_COPILOT_GHOST_PREVIEW_PAYLOAD", "Invalid ghost preview payload", {
        issues: parsed.error.flatten(),
      });
    }

    const preview = buildGhostActionPreview(parsed.data);
    return NextResponse.json({ preview });
  } catch (error) {
    return structuredApiError(500, "COPILOT_GHOST_PREVIEW_FAILED", "Failed to generate ghost preview", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
