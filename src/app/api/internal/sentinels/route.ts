import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import {
  createSentinel,
  listSentinels,
} from "@/server/services/sentinels/sentinel-service";

const createSentinelSchema = z.object({
  name: z.string().min(1).max(200),
  agentId: z.string().min(1),
  watchUrl: z.string().url(),
  checkInterval: z.string().min(1),
});

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");

  const sentinels = await listSentinels(user.organizationId!);

  return NextResponse.json({ items: sentinels });
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");

  const { data, error } = await parseJsonBody(request, createSentinelSchema);
  if (error) {
    return error;
  }

  const sentinel = await createSentinel({
    organizationId: user.organizationId!,
    createdById: user.id,
    agentId: data.agentId,
    name: data.name,
    watchUrl: data.watchUrl,
    checkInterval: data.checkInterval,
  });

  return NextResponse.json(sentinel, { status: 201 });
}
