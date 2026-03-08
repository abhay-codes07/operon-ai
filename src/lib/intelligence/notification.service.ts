import { getAppEnv } from "@/config/env";
import { logInfo, logWarn } from "@/server/observability/logger";

export async function sendSlackAlert(input: {
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const env = getAppEnv();
  if (!env.SLACK_WEBHOOK_URL) {
    logWarn("Slack webhook not configured for intelligence notifications", {
      component: "intelligence-notification",
      metadata: input.metadata,
    });
    return { delivered: false };
  }

  const response = await fetch(env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: `*${input.title}*\n${input.message}`,
    }),
  }).catch(() => null);

  const delivered = Boolean(response?.ok);
  logInfo("Intelligence Slack alert attempted", {
    component: "intelligence-notification",
    metadata: {
      delivered,
      ...input.metadata,
    },
  });

  return { delivered };
}
