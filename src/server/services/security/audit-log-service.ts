import { listExecutionAudits } from "@/server/repositories/security/audit-repository";

type AuditResult = "APPROVED" | "BLOCKED" | "FAILED";

export async function fetchAuditLogs(input: {
  organizationId: string;
  agentId?: string;
  result?: AuditResult;
  limit?: number;
}) {
  return listExecutionAudits(input);
}
