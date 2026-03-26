import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { parseJsonBody } from "@/server/api/validation";
import {
  appendExecutionEvent,
  queueExecution,
} from "@/server/services/executions/execution-service";

const reconLaunchSchema = z.object({
  domain: z.string().trim().min(1),
  agentId: z.string().trim().min(1),
});

const CHECK_TYPES = [
  "ADMIN_PANELS",
  "SENSITIVE_FILES",
  "LOGIN_LEAKAGE",
  "DIRECTORY_LISTING",
  "API_EXPOSURE",
  "SSL_HEADERS",
] as const;

type CheckType = (typeof CHECK_TYPES)[number];

function buildTaskPrompt(checkType: CheckType, domain: string): string {
  switch (checkType) {
    case "ADMIN_PANELS":
      return `Visit ${domain}/admin, ${domain}/wp-admin, ${domain}/administrator, ${domain}/dashboard/admin. For each URL, report: HTTP status (accessible/forbidden/not-found), page title, and whether login is bypassed or content is visible without authentication.`;
    case "SENSITIVE_FILES":
      return `Visit ${domain}/.env, ${domain}/config.php, ${domain}/phpinfo.php, ${domain}/.git/config, ${domain}/backup.sql. For each URL report whether the file is accessible and what sensitive data is visible.`;
    case "LOGIN_LEAKAGE":
      return `Visit ${domain}/login (or the main login page). Try submitting: (1) a valid-format email with wrong password, (2) a nonexistent email. Compare the error messages — do they reveal whether the email exists? Report exact error text for both attempts.`;
    case "DIRECTORY_LISTING":
      return `Visit ${domain}/uploads/, ${domain}/images/, ${domain}/files/, ${domain}/assets/, ${domain}/static/. Report whether directory listing is enabled (shows file list) or forbidden for each.`;
    case "API_EXPOSURE":
      return `Visit ${domain}/api/, ${domain}/api/v1/, ${domain}/api/users, ${domain}/api/admin, ${domain}/swagger, ${domain}/api-docs. Report which endpoints respond and what data they return without authentication.`;
    case "SSL_HEADERS":
      return `Visit ${domain} and inspect the HTTP response headers. Look for: Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, X-XSS-Protection headers. Report which are present and which are missing.`;
  }
}

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  const { data, error } = await parseJsonBody(request, reconLaunchSchema);
  if (error) {
    return error;
  }

  const reconId = crypto.randomUUID();
  const { domain, agentId } = data;

  const checks = await Promise.all(
    CHECK_TYPES.map(async (checkType) => {
      const execution = await queueExecution({
        organizationId: user.organizationId!,
        agentId,
        requestedById: user.id,
        trigger: "MANUAL",
        inputPayload: {
          reconId,
          checkType,
          targetUrl: domain,
          taskOverride: buildTaskPrompt(checkType, domain),
        },
      });

      await appendExecutionEvent({
        organizationId: user.organizationId!,
        executionId: execution.id,
        level: "INFO",
        message: `Recon execution queued (reconId: ${reconId}, checkType: ${checkType}, domain: ${domain})`,
      });

      return { executionId: execution.id, checkType };
    }),
  );

  return NextResponse.json({ reconId, checks }, { status: 201 });
}
