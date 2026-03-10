type BillingPlan = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";

export type SubscriptionSnapshot = {
  id: string;
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  plan: BillingPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type UsageSnapshot = {
  id: string;
  organizationId: string;
  metric: string;
  periodStart: Date;
  periodEnd: Date;
  quantity: number;
};

export const planExecutionLimits: Record<BillingPlan, number> = {
  FREE: 100,
  STARTER: 1000,
  GROWTH: 10000,
  ENTERPRISE: 100000,
};
