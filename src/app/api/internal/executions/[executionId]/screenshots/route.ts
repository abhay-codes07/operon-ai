import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppEnv } from "@/config/env";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const paramsSchema = z.object({
  executionId: z.string().trim().min(1),
});

type RouteContext = {
  params: { executionId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid execution identifier" }, { status: 400 });
  }

  // Verify execution belongs to org
  const execution = await prisma.execution.findFirst({
    where: { id: parsed.data.executionId, organizationId: user.organizationId! },
    select: { outputPayload: true },
  });

  if (!execution) {
    return NextResponse.json({ error: "Execution not found" }, { status: 404 });
  }

  // Screenshots are stored in outputPayload.screenshots as [{ screenshotId, storagePath, mimeType }]
  const payload = execution.outputPayload as Record<string, unknown> | null;
  const screenshots = (payload?.screenshots as Array<{ screenshotId: string; storagePath: string; mimeType: string }>) ?? [];

  // Read each file and return as base64
  const env = getAppEnv();
  const results = await Promise.all(
    screenshots.map(async (s) => {
      try {
        const absolutePath = s.storagePath.startsWith("/") || s.storagePath.includes(":")
          ? s.storagePath
          : path.join(env.SCREENSHOT_STORAGE_BASE_PATH, s.storagePath);
        const data = await readFile(absolutePath);
        return {
          screenshotId: s.screenshotId,
          mimeType: s.mimeType,
          base64Data: data.toString("base64"),
        };
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({ screenshots: results.filter(Boolean) });
}
