export type SubscriptionPlan = "free" | "standard" | "pro";

export type ClerkBillingPlanSlug = "user:standard" | "user:pro";

export interface SubscriptionPlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number;
  maxMinutesPerSession: number;
  hasSessionHistory: boolean;
}

export const BILLING_PLAN_SLUGS = {
  standard: "user:standard",
  pro: "user:pro",
} as const satisfies Record<
  Exclude<SubscriptionPlan, "free">,
  ClerkBillingPlanSlug
>;

export const SUBSCRIPTION_PLAN_LIMITS = {
  free: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxMinutesPerSession: 5,
    hasSessionHistory: false,
  },
  standard: {
    maxBooks: 10,
    maxSessionsPerMonth: 50,
    maxMinutesPerSession: 15,
    hasSessionHistory: true,
  },
  pro: {
    maxBooks: 100,
    maxSessionsPerMonth: 100,
    maxMinutesPerSession: 50,
    hasSessionHistory: true,
  },
} as const satisfies Record<SubscriptionPlan, SubscriptionPlanLimits>;

export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

export const getNextBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
};

export const getCurrentBillingPeriodRange = (): {
  start: Date;
  end: Date;
} => ({
  start: getCurrentBillingPeriodStart(),
  end: getNextBillingPeriodStart(),
});
