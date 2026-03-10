import { logWarn } from "@/server/observability/logger";
import { sendSlackAlert } from "@/lib/intelligence/notification.service";

export async function sendShieldAlert(input: {
  organizationId: string;
  executionId: string;
  title: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
  const delivered = await sendSlackAlert({
    title: `Operon Shield ${input.severity}: ${input.title}`,
    message: input.message,
    metadata: {
      organizationId: input.organizationId,
      executionId: input.executionId,
      source: "operon-shield",
    },
  }).catch(() => ({ delivered: false }));

  if (!delivered.delivered) {
    logWarn("Operon Shield alert delivery failed", {
      component: "shield-alert-service",
      metadata: {
        organizationId: input.organizationId,
        executionId: input.executionId,
        severity: input.severity,
      },
    });
  }

  return delivered;
}
