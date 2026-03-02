import { planExecutionLimits, type SubscriptionSnapshot } from "@/modules/billing/contracts";
import {
  getOrganizationSubscription,
  upsertOrganizationSubscription,
} from "@/server/repositories/billing/subscription-repository";
import { getUsageRecord, incrementUsageRecord } from "@/server/repositories/billing/usage-repository";

const EXECUTION_METRIC = "executions";

export async function getOrCreateOrganizationSubscription(
  organizationId: string,
): Promise<SubscriptionSnapshot> {
  const existing = await getOrganizationSubscription(organizationId);

  if (existing) {
    return existing;
  }

  return upsertOrganizationSubscription({
    organizationId,
    stripeCustomerId: `bootstrap_${organizationId}`,
    plan: "FREE",
    status: "TRIALING",
  });
}

export async function canConsumeExecution(organizationId: string): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  plan: SubscriptionSnapshot["plan"];
}> {
  const subscription = await getOrCreateOrganizationSubscription(organizationId);
  const usage = await getUsageRecord({
    organizationId,
    metric: EXECUTION_METRIC,
  });

  const limit = planExecutionLimits[subscription.plan];
  const used = usage?.quantity ?? 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: remaining > 0,
    limit,
    used,
    remaining,
    plan: subscription.plan,
  };
}

export async function recordExecutionUsage(organizationId: string, amount = 1) {
  return incrementUsageRecord({
    organizationId,
    metric: EXECUTION_METRIC,
    amount,
  });
}
