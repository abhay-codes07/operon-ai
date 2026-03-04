import { NextResponse } from "next/server";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchKnowledgeGraphSnapshot } from "@/server/services/knowledge/knowledge-graph-service";

export async function GET() {
  const user = await requireOrganizationRole("MEMBER");
  const graph = await fetchKnowledgeGraphSnapshot(user.organizationId!);

  return NextResponse.json(graph);
}
