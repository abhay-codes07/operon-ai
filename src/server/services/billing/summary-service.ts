import { getOrCreateOrganizationSubscription } from "@/server/services/billing/usage-service";
import { getUsageRecord } from "@/server/repositories/billing/usage-repository";

export async function getBillingSummary(organizationId: string) {
  const subscription = await getOrCreateOrganizationSubscription(organizationId);
  const usage = await getUsageRecord({
    organizationId,
    metric: "executions",
  });

  return {
    subscription,
    usage: usage ?? null,
  };
}
