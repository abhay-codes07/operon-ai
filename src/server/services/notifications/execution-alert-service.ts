import nodemailer from "nodemailer";

import { getAppEnv } from "@/config/env";
import { logInfo } from "@/server/observability/logger";

type ExecutionAlertInput = {
  executionId: string;
  workflowName: string;
  agentId: string;
  status: "SUCCEEDED" | "FAILED";
  summary?: string;
  errorMessage?: string;
  outputPayload?: Record<string, unknown> | null;
  durationMs?: number;
};

function buildEmailHtml(input: ExecutionAlertInput): string {
  const statusColor = input.status === "SUCCEEDED" ? "#10b981" : "#f43f5e";
  const statusLabel = input.status === "SUCCEEDED" ? "✓ Succeeded" : "✗ Failed";

  const priceSection = (() => {
    if (input.status !== "SUCCEEDED" || !input.outputPayload) return "";
    const output = (input.outputPayload.output as Record<string, unknown> | undefined) ?? {};
    const prices = (output.prices ?? output.results ?? output.comparison ?? output.products) as
      | Array<{ site?: string; price?: string | number; name?: string }>
      | undefined;
    if (!prices || !Array.isArray(prices) || prices.length === 0) return "";

    const rows = prices
      .slice(0, 8)
      .map(
        (p) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #334155;color:#cbd5e1">${p.site ?? "—"}</td>
           <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#cbd5e1;max-width:200px">${p.name ?? "—"}</td>
           <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#22d3ee;font-weight:bold;text-align:right">${p.price ?? "N/A"}</td></tr>`,
      )
      .join("");

    return `
      <h3 style="color:#94a3b8;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:24px 0 8px">Price Comparison</h3>
      <table style="width:100%;border-collapse:collapse;background:#0f172a;border-radius:8px;overflow:hidden">
        <thead><tr>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;background:#1e293b">Site</th>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:11px;background:#1e293b">Product</th>
          <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:11px;background:#1e293b">Price</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  })();

  const summarySection = input.summary
    ? `<div style="background:#1e293b;border-radius:8px;padding:12px 16px;margin:16px 0;border-left:3px solid #22d3ee">
        <p style="color:#94a3b8;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.08em">Summary</p>
        <p style="color:#e2e8f0;margin:0;font-size:14px">${input.summary}</p>
       </div>`
    : "";

  const errorSection = input.errorMessage
    ? `<div style="background:#1e293b;border-radius:8px;padding:12px 16px;margin:16px 0;border-left:3px solid #f43f5e">
        <p style="color:#f87171;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.08em">Error</p>
        <p style="color:#fca5a5;margin:0;font-size:13px;font-family:monospace">${input.errorMessage}</p>
       </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <!-- Header -->
    <div style="margin-bottom:32px">
      <span style="color:#22d3ee;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">Operon AI</span>
    </div>

    <!-- Status pill -->
    <div style="display:inline-block;background:${statusColor}22;border:1px solid ${statusColor}55;border-radius:999px;padding:4px 14px;margin-bottom:16px">
      <span style="color:${statusColor};font-size:12px;font-weight:700">${statusLabel}</span>
    </div>

    <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 4px">${input.workflowName}</h1>
    <p style="color:#64748b;font-size:13px;margin:0 0 24px">
      Execution <code style="color:#94a3b8">${input.executionId.slice(-10)}</code>
      ${input.durationMs ? `· ${(input.durationMs / 1000).toFixed(1)}s` : ""}
    </p>

    ${summarySection}
    ${priceSection}
    ${errorSection}

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1e293b">
      <p style="color:#334155;font-size:12px;margin:0">
        Operon AI · Autonomous Web Agent Platform
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendSlackAlert(input: ExecutionAlertInput, webhookUrl: string) {
  const emoji = input.status === "SUCCEEDED" ? "✅" : "❌";
  const text = `${emoji} *${input.workflowName}* ${input.status.toLowerCase()}\n${
    input.summary ? `> ${input.summary}` : input.errorMessage ?? ""
  }\nExecution \`${input.executionId.slice(-10)}\``;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export async function sendExecutionAlert(input: ExecutionAlertInput): Promise<void> {
  const env = getAppEnv();

  const promises: Promise<void>[] = [];

  // Email alert
  if (env.SMTP_HOST && env.ALERT_EMAIL_TO) {
    promises.push(
      (async () => {
        const transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT ?? 587,
          secure: (env.SMTP_PORT ?? 587) === 465,
          auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } : undefined,
        });

        await transporter.sendMail({
          from: env.ALERT_EMAIL_FROM ?? "operon-ai@noreply.local",
          to: env.ALERT_EMAIL_TO,
          subject: `[Operon] ${input.status === "SUCCEEDED" ? "✓" : "✗"} ${input.workflowName}`,
          html: buildEmailHtml(input),
        });

        logInfo("Execution email alert sent", {
          component: "execution-alert-service",
          executionId: input.executionId,
          metadata: { to: env.ALERT_EMAIL_TO, status: input.status },
        });
      })().catch((err) => {
        console.error("[ExecutionAlert] Email failed:", err instanceof Error ? err.message : err);
      }),
    );
  }

  // Slack alert
  if (env.SLACK_WEBHOOK_URL) {
    promises.push(
      sendSlackAlert(input, env.SLACK_WEBHOOK_URL).catch((err) => {
        console.error("[ExecutionAlert] Slack failed:", err instanceof Error ? err.message : err);
      }),
    );
  }

  await Promise.all(promises);
}
