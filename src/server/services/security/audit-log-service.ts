import type { AuditResult } from "@prisma/client";

import { listExecutionAudits } from "@/server/repositories/security/audit-repository";

export async function fetchAuditLogs(input: {
  organizationId: string;
  agentId?: string;
  result?: AuditResult;
  limit?: number;
}) {
  return listExecutionAudits(input);
}
