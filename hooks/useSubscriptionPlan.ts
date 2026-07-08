"use client";

import { useAuth } from "@clerk/nextjs";
import {
  getSubscriptionAccess,
  hasSubscriptionPlan,
} from "@/lib/subscription-access";

export const useSubscriptionPlan = () => {
  const { has, isLoaded, isSignedIn } = useAuth();
  const access = getSubscriptionAccess(has);

  return {
    ...access,
    isLoaded,
    isSignedIn,
    hasPlan: (plan: "standard" | "pro") => hasSubscriptionPlan(has, plan),
  };
};
