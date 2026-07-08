import {
  BILLING_PLAN_SLUGS,
  SUBSCRIPTION_PLAN_LIMITS,
  type ClerkBillingPlanSlug,
  type SubscriptionPlan,
  type SubscriptionPlanLimits,
} from "./subscription-constants";

type HasPlanAccess = (params: { plan: ClerkBillingPlanSlug }) => boolean;

export interface SubscriptionAccess {
  plan: SubscriptionPlan;
  limits: SubscriptionPlanLimits;
  hasSessionHistory: boolean;
  hasStandardAccess: boolean;
  hasProAccess: boolean;
}

export const hasSubscriptionPlan = (
  has: HasPlanAccess,
  plan: Exclude<SubscriptionPlan, "free">,
) => has({ plan: BILLING_PLAN_SLUGS[plan] });

export const resolveSubscriptionPlan = (
  has: HasPlanAccess,
): SubscriptionPlan => {
  if (hasSubscriptionPlan(has, "pro")) {
    return "pro";
  }

  if (hasSubscriptionPlan(has, "standard")) {
    return "standard";
  }

  return "free";
};

export const getSubscriptionLimits = (
  plan: SubscriptionPlan,
): SubscriptionPlanLimits => SUBSCRIPTION_PLAN_LIMITS[plan];

export const getSubscriptionAccess = (
  has: HasPlanAccess,
): SubscriptionAccess => {
  const plan = resolveSubscriptionPlan(has);
  const limits = getSubscriptionLimits(plan);

  return {
    plan,
    limits,
    hasSessionHistory: limits.hasSessionHistory,
    hasStandardAccess: plan !== "free",
    hasProAccess: plan === "pro",
  };
};
